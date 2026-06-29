import { create } from 'zustand';
import type {
  AuthUser,
  HelpSection,
  Message,
  PlanTier,
  StudentVerifyResponse,
  Subscription,
  WorkspaceId,
  WorkspaceType,
} from './types';
import { canAccessWorkspace, isAuthenticated } from './access';
import { enrichAuthUser } from './authSession';
import {
  clearSessionData,
  emptyChatHistory,
  loadSettings,
  loadSubscription,
  saveSettings,
  saveSubscription,
  type AppSettings,
} from '../lib/utils';
import { clearAuthToken, fetchAuthMe, loadAuthToken, saveAuthToken as persistToken } from '../lib/authApi';

interface AppState {
  currentWorkspace: WorkspaceType;
  pendingPrompt: string | null;
  pendingImageUrl: string | null;
  helpSection: HelpSection;
  messages: Record<WorkspaceId, Message[]>;
  settings: AppSettings;
  subscription: Subscription;
  authUser: AuthUser | null;
  authToken: string | null;
  loginModalOpen: boolean;
  pendingAuthAction: (() => void) | null;
  loading: boolean;
  error: string | null;

  setWorkspace: (workspace: WorkspaceType) => void;
  openHelp: (section?: HelpSection) => void;
  openPricing: () => void;
  openStudentVerify: () => void;
  navigateToWorkspace: (workspace: WorkspaceId, prompt?: string, imageUrl?: string) => void;
  goToHome: () => void;
  consumePendingPrompt: () => string | null;
  consumePendingImage: () => string | null;

  requireAuth: (action: () => void) => void;
  openLoginModal: (action?: () => void) => void;
  closeLoginModal: () => void;
  setAuthSession: (token: string, user: AuthUser) => void;
  refreshAuthUser: () => Promise<void>;
  restoreAuthSession: () => Promise<void>;
  logout: () => void;
  wipeSession: () => void;

  selectPlan: (plan: PlanTier) => void;
  applyStudentVerification: (result: StudentVerifyResponse) => void;

  addMessage: (workspaceId: WorkspaceId, message: Message) => void;
  clearMessages: (workspaceId: WorkspaceId) => void;
  clearAllMessages: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function tryOpenWorkspace(
  workspace: WorkspaceType,
  subscription: Subscription,
  authUser: AuthUser | null,
  set: (partial: Partial<AppState>) => void,
  openLogin: (action?: () => void) => void,
  retry: () => void,
): boolean {
  if (
    workspace === 'pricing' ||
    workspace === 'student-verify' ||
    workspace === 'home' ||
    workspace === 'history' ||
    workspace === 'settings' ||
    workspace === 'help'
  ) {
    set({ currentWorkspace: workspace, error: null });
    return true;
  }

  if (!isAuthenticated(authUser)) {
    openLogin(retry);
    return false;
  }

  if (canAccessWorkspace(workspace, subscription, authUser)) {
    set({ currentWorkspace: workspace, error: null });
    return true;
  }
  if (subscription.plan === 'student' && subscription.studentVerification.status !== 'approved') {
    set({ currentWorkspace: 'student-verify', error: null });
    return false;
  }
  set({ currentWorkspace: 'pricing', error: null });
  return false;
}

export const useAppStore = create<AppState>((set, getState) => ({
  currentWorkspace: 'home',
  pendingPrompt: null,
  pendingImageUrl: null,
  helpSection: 'overview',
  messages: emptyChatHistory(),
  settings: loadSettings(),
  subscription: loadSubscription(),
  authUser: null,
  authToken: loadAuthToken(),
  loginModalOpen: false,
  pendingAuthAction: null,
  loading: false,
  error: null,

  openLoginModal: (action) =>
    set({
      loginModalOpen: true,
      pendingAuthAction: action ?? null,
    }),

  closeLoginModal: () => set({ loginModalOpen: false, pendingAuthAction: null }),

  requireAuth: (action) => {
    if (isAuthenticated(getState().authUser)) {
      action();
      return;
    }
    getState().openLoginModal(action);
  },

  setAuthSession: (token, user) => {
    persistToken(token);
    const enriched = enrichAuthUser(user);
    const settings = { ...getState().settings, displayName: enriched.name };
    saveSettings(settings);
    const pending = getState().pendingAuthAction;
    set({
      authToken: token,
      authUser: enriched,
      settings,
      loginModalOpen: false,
      pendingAuthAction: null,
      error: null,
    });
    queueMicrotask(() => pending?.());
  },

  refreshAuthUser: async () => {
    const token = getState().authToken;
    if (!token) return;
    try {
      const user = enrichAuthUser(await fetchAuthMe(token));
      set({ authUser: user });
    } catch {
      getState().logout();
    }
  },

  restoreAuthSession: async () => {
    const token = loadAuthToken();
    if (!token) return;
    set({ authToken: token });
    try {
      const user = enrichAuthUser(await fetchAuthMe(token));
      set({ authUser: user, settings: { ...getState().settings, displayName: user.name } });
    } catch {
      clearAuthToken();
      set({ authToken: null, authUser: null });
    }
  },

  logout: () => {
    clearAuthToken();
    getState().wipeSession();
    set({
      authUser: null,
      authToken: null,
      loginModalOpen: false,
      pendingAuthAction: null,
      currentWorkspace: 'home',
    });
  },

  wipeSession: () => {
    clearSessionData();
    set({ messages: emptyChatHistory() });
  },

  setWorkspace: (ws) => {
    const { subscription, authUser } = getState();
    if (ws === 'pricing' || ws === 'student-verify' || ws === 'home' || ws === 'history' || ws === 'settings' || ws === 'help') {
      set({ currentWorkspace: ws, error: null });
      return;
    }
    tryOpenWorkspace(ws, subscription, authUser, set, getState().openLoginModal, () =>
      getState().setWorkspace(ws),
    );
  },

  openHelp: (section = 'overview') =>
    set({ currentWorkspace: 'help', helpSection: section, error: null }),

  openPricing: () => set({ currentWorkspace: 'pricing', error: null }),

  openStudentVerify: () => set({ currentWorkspace: 'student-verify', error: null }),

  navigateToWorkspace: (workspace, prompt, imageUrl) => {
    const run = () => {
      const { subscription, authUser } = getState();
      const payload = {
        pendingPrompt: prompt ?? null,
        pendingImageUrl: imageUrl ?? null,
      };
      if (canAccessWorkspace(workspace, subscription, authUser)) {
        set({ currentWorkspace: workspace, ...payload, error: null });
        return;
      }
      if (subscription.plan === 'student') {
        set({ currentWorkspace: 'student-verify', ...payload, error: null });
        return;
      }
      set({ currentWorkspace: 'pricing', ...payload, error: null });
    };

    getState().requireAuth(run);
  },

  goToHome: () => set({ currentWorkspace: 'home', error: null }),

  consumePendingPrompt: () => {
    const prompt = getState().pendingPrompt;
    set({ pendingPrompt: null });
    return prompt;
  },

  consumePendingImage: () => {
    const imageUrl = getState().pendingImageUrl;
    set({ pendingImageUrl: null });
    return imageUrl;
  },

  selectPlan: (plan) => {
    const subscription: Subscription =
      plan === 'student'
        ? { plan: 'student', studentVerification: { status: 'none' } }
        : { plan, studentVerification: { status: 'none' } };
    saveSubscription(subscription);
    set({ subscription, error: null });
    if (plan === 'student') set({ currentWorkspace: 'student-verify' });
    else set({ currentWorkspace: 'home' });
  },

  applyStudentVerification: (result) => {
    const subscription: Subscription = {
      plan: 'student',
      studentVerification: {
        status: result.approved ? 'approved' : 'rejected',
        submittedAt: Date.now(),
        reviewedAt: Date.now(),
        reason: result.reason,
        institutionName: result.institutionName,
        expiryDate: result.expiryDate,
      },
    };
    saveSubscription(subscription);
    set({ subscription, error: result.approved ? null : result.reason });
    if (result.approved) set({ currentWorkspace: 'home' });
  },

  addMessage: (workspaceId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [workspaceId]: [...state.messages[workspaceId], message],
      },
    })),

  clearMessages: (workspaceId) =>
    set((state) => ({
      messages: { ...state.messages, [workspaceId]: [] },
    })),

  clearAllMessages: () => set({ messages: emptyChatHistory() }),

  updateSettings: (patch) =>
    set((state) => {
      const settings = { ...state.settings, ...patch };
      saveSettings(settings);
      return { settings };
    }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useAppStore.getState().wipeSession();
  });
}

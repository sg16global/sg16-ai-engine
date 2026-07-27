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
import { canAccessWorkspace, defaultSubscription, isAuthenticated } from './access';
import { enrichAuthUser } from './authSession';
import {
  clearAllMemories,
  clearSessionData,
  clearSessionSettings,
  emptyChatHistory,
  loadChatHistory,
  loadSettings,
  loadSubscription,
  saveChatHistory,
  saveSettings,
  saveSubscription,
  type AppSettings,
} from '../lib/utils';
import { clearAuthToken, fetchAuthMe, loadAuthToken, saveAuthToken as persistToken } from '../lib/authApi';
import {
  fetchBillingConfig,
  fetchBillingEntitlements,
  subscriptionFromApi,
} from '../lib/billingApi';
import { scheduleHistorySync, syncUserHistoryOnLogin } from '../lib/userRoomApi';
import { pushAppPath, routeToPath } from './routes';

interface AppState {
  currentWorkspace: WorkspaceType;
  pendingPrompt: string | null;
  pendingPromptToken: number;
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
  launchFree: boolean;
  checkoutEnabled: boolean;
  launchMessage: string;
  launchNoticeOpen: boolean;

  setWorkspace: (workspace: WorkspaceType) => void;
  openHelp: (section?: HelpSection) => void;
  openPricing: () => void;
  openStudentVerify: () => void;
  openUserRoom: () => void;
  openLaunchNotice: () => void;
  closeLaunchNotice: () => void;
  navigateToWorkspace: (workspace: WorkspaceId, prompt?: string, imageUrl?: string) => void;
  goToHome: () => void;
  consumePendingPrompt: () => string | null;
  consumePendingImage: () => string | null;

  requireAuth: (action: () => void) => void;
  openLoginModal: (action?: () => void) => void;
  closeLoginModal: () => void;
  setAuthSession: (token: string, user: AuthUser) => void;
  /** Local / preview enter — no Google. Use when OAuth is blocked. */
  enterLocalPreview: () => void;
  refreshAuthUser: () => Promise<void>;
  restoreAuthSession: () => Promise<void>;
  logout: () => void;
  wipeSession: () => void;

  selectPlan: (plan: PlanTier) => void;
  startCheckout: (plan: 'student' | 'pro') => Promise<void>;
  syncSubscriptionFromServer: () => Promise<void>;
  loadPublicConfig: () => Promise<void>;
  applyStudentVerification: (result: StudentVerifyResponse) => void;

  addMessage: (workspaceId: WorkspaceId, message: Message) => void;
  clearMessages: (workspaceId: WorkspaceId) => void;
  clearAllMessages: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function persistMessages(messages: AppState['messages'], userId?: string | null) {
  saveChatHistory(messages, userId);
  if (userId) scheduleHistorySync(messages);
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
    workspace === 'user-room' ||
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
  pendingPromptToken: 0,
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
  launchFree: true,
  checkoutEnabled: false,
  launchMessage:
    'Launch period — all features are free unlimited. We will notify you in the app before paid plans begin.',
  launchNoticeOpen: false,

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
    const subscription = user.subscription
      ? { ...defaultSubscription(), ...user.subscription }
      : getState().subscription;
    saveSubscription(subscription);
    const settings = { ...getState().settings, displayName: enriched.name };
    saveSettings(settings);
    const pending = getState().pendingAuthAction;
    set({
      authToken: token,
      authUser: enriched,
      subscription,
      settings,
      messages: loadChatHistory(enriched.id),
      loginModalOpen: false,
      pendingAuthAction: null,
      error: null,
      ...(user.launchFree !== undefined
        ? { launchFree: user.launchFree, checkoutEnabled: !user.launchFree }
        : {}),
    });
    queueMicrotask(() => {
      if (pending) {
        pending();
      } else {
        getState().goToHome();
      }
      void getState().syncSubscriptionFromServer();
      void syncUserHistoryOnLogin(enriched.id, loadChatHistory, saveChatHistory).then((merged) => {
        set({ messages: merged });
      });
    });
  },

  enterLocalPreview: () => {
    const user: AuthUser = {
      id: 'local-preview',
      signupDate: Date.now(),
      name: 'SG16 Preview',
      launchFree: true,
      trialActive: false,
      trialDaysRemaining: 0,
    };
    getState().setAuthSession('local-preview-token', user);
    getState().setWorkspace('home');
  },

  syncSubscriptionFromServer: async () => {
    const token = getState().authToken;
    if (!token) return;
    try {
      const data = await fetchBillingEntitlements();
      const subscription = subscriptionFromApi(data.subscription);
      saveSubscription(subscription);
      set({ subscription, error: null });
    } catch {
      /* billing may be offline or user not subscribed yet */
    }
  },

  loadPublicConfig: async () => {
    try {
      const config = await fetchBillingConfig();
      const launchFree = config.launchFree ?? true;
      const checkoutEnabled = config.checkoutEnabled ?? false;
      const launchMessage =
        config.launchMessage ??
        'Launch period — all features are free unlimited. We will notify you in the app before paid plans begin.';
      const { authUser } = getState();
      set({
        launchFree,
        checkoutEnabled,
        launchMessage,
        ...(authUser ? { authUser: { ...authUser, launchFree } } : {}),
      });
    } catch {
      /* keep launch defaults until server responds */
    }
  },

  refreshAuthUser: async () => {
    const token = getState().authToken;
    if (!token) return;
    try {
      const me = await fetchAuthMe(token);
      const user = enrichAuthUser(me.user);
      const subscription = me.subscription
        ? { ...defaultSubscription(), ...me.subscription }
        : getState().subscription;
      saveSubscription(subscription);
      set({ authUser: user, subscription });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('session') || message.toLowerCase().includes('sign in')) {
        getState().logout();
      }
    }
  },

  restoreAuthSession: async () => {
    const token = loadAuthToken();
    if (!token) return;
    set({ authToken: token });
    try {
      const me = await fetchAuthMe(token);
      const user = enrichAuthUser(me.user);
      const subscription = me.subscription
        ? { ...defaultSubscription(), ...me.subscription }
        : getState().subscription;
      saveSubscription(subscription);
      set({
        authUser: user,
        subscription,
        messages: loadChatHistory(user.id),
        settings: { ...getState().settings, displayName: user.name },
      });
      void syncUserHistoryOnLogin(user.id, loadChatHistory, saveChatHistory).then((merged) => {
        set({ messages: merged });
      });
    } catch {
      clearAuthToken();
      set({ authToken: null, authUser: null, messages: emptyChatHistory() });
    }
  },

  logout: () => {
    const userId = getState().authUser?.id;
    persistMessages(getState().messages, userId);
    clearAuthToken();
    clearAllMemories();
    clearSessionSettings();
    pushAppPath('/', true);
    set({
      authUser: null,
      authToken: null,
      loginModalOpen: false,
      pendingAuthAction: null,
      currentWorkspace: 'home',
      messages: emptyChatHistory(),
    });
  },

  wipeSession: () => {
    const userId = getState().authUser?.id;
    clearSessionData(userId);
    set({ messages: emptyChatHistory() });
  },

  setWorkspace: (ws) => {
    const { subscription, authUser } = getState();
    if (ws === 'pricing' || ws === 'student-verify' || ws === 'home' || ws === 'user-room' || ws === 'history' || ws === 'settings' || ws === 'help') {
      set({ currentWorkspace: ws, error: null });
      const path = routeToPath(ws);
      if (path) pushAppPath(path);
      return;
    }
    tryOpenWorkspace(ws, subscription, authUser, set, getState().openLoginModal, () =>
      getState().setWorkspace(ws),
    );
  },

  openHelp: (section = 'overview') => {
    set({ currentWorkspace: 'help', helpSection: section, error: null });
    const path = routeToPath('help', section);
    if (path) pushAppPath(path);
  },

  openPricing: () => {
    set({ currentWorkspace: 'pricing', error: null });
    pushAppPath('/pricing');
  },

  openLaunchNotice: () => set({ launchNoticeOpen: true }),
  closeLaunchNotice: () => set({ launchNoticeOpen: false }),

  openStudentVerify: () => set({ currentWorkspace: 'student-verify', error: null }),

  openUserRoom: () => {
    set({ currentWorkspace: 'user-room', error: null });
    pushAppPath('/room');
  },

  goToHome: () => {
    set({ currentWorkspace: 'home', error: null });
    pushAppPath('/');
  },

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
    if (plan !== 'free') return;
    const subscription = defaultSubscription();
    saveSubscription(subscription);
    set({ subscription, error: null, currentWorkspace: 'home' });
  },

  startCheckout: async (plan) => {
    const { authUser, requireAuth } = getState();
    if (!isAuthenticated(authUser)) {
      requireAuth(() => void getState().startCheckout(plan));
      return;
    }
    // Paddle removed — pricing stays visible; live checkout waits for new provider (e.g. Dodo)
    void plan;
    set({ launchNoticeOpen: true, error: null, loading: false });
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
      billingActive: getState().subscription.billingActive,
      subscriptionStatus: getState().subscription.subscriptionStatus,
    };
    saveSubscription(subscription);
    set({ subscription, error: result.approved ? null : result.reason });
    void getState().syncSubscriptionFromServer();
    if (result.approved) set({ currentWorkspace: 'home' });
  },

  addMessage: (workspaceId, message) =>
    set((state) => {
      const messages = {
        ...state.messages,
        [workspaceId]: [...state.messages[workspaceId], message],
      };
      persistMessages(messages, state.authUser?.id);
      return { messages };
    }),

  clearMessages: (workspaceId) =>
    set((state) => {
      const messages = { ...state.messages, [workspaceId]: [] };
      persistMessages(messages, state.authUser?.id);
      return { messages };
    }),

  clearAllMessages: () =>
    set((state) => {
      persistMessages(emptyChatHistory(), state.authUser?.id);
      return { messages: emptyChatHistory() };
    }),

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
  queueMicrotask(() => {
    void useAppStore.getState().loadPublicConfig();
  });

  window.addEventListener('beforeunload', () => {
    const { messages, authUser } = useAppStore.getState();
    persistMessages(messages, authUser?.id);
  });
}

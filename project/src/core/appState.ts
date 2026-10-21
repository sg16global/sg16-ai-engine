import { create } from 'zustand';
import type {
  AuthUser,
  ChatThread,
  ChatThreads,
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
  emptyChatThreads,
  loadChatThreads,
  loadSettings,
  loadSubscription,
  saveChatThreads,
  saveSettings,
  saveSubscription,
  threadTitle,
  uid,
  type AppSettings,
} from '../lib/utils';
import { ApiError } from '../lib/apiClient';
import {
  clearAuthToken,
  fetchAuthMe,
  hasDeviceId,
  loadAuthToken,
  loginDevice,
  saveAuthToken as persistToken,
} from '../lib/authApi';
import {
  fetchBillingConfig,
  fetchBillingEntitlements,
  subscriptionFromApi,
} from '../lib/billingApi';
import { pushAppPath, routeToPath } from './routes';

export interface PendingPrompt {
  workspaceId: WorkspaceId;
  content: string;
  /** Short bubble text when `content` is a long machine prompt. */
  display?: string;
  imageUrl?: string;
  /** Put the text in the message box for the user to finish, instead of sending it. */
  draft?: boolean;
}

interface AppState {
  currentWorkspace: WorkspaceType;
  /** A prompt waiting to be sent by one shield's chat as soon as it is on screen. */
  pendingPrompt: PendingPrompt | null;
  pendingPromptToken: number;
  helpSection: HelpSection;
  /** Every saved conversation, per shield. */
  threads: ChatThreads;
  /** Open conversation per shield; null = a fresh, empty chat. */
  activeThreadId: Partial<Record<WorkspaceId, string | null>>;
  /** Shields waiting on an AI reply — each shield can chat independently. */
  busy: Partial<Record<WorkspaceId, boolean>>;
  settings: AppSettings;
  subscription: Subscription;
  authUser: AuthUser | null;
  authToken: string | null;
  loading: boolean;
  error: string | null;
  launchFree: boolean;
  checkoutEnabled: boolean;
  launchMessage: string;
  launchNoticeOpen: boolean;
  stagingOpen: boolean;

  setWorkspace: (workspace: WorkspaceType) => void;
  openStaging: () => void;
  closeStaging: () => void;
  openHelp: (section?: HelpSection) => void;
  openPricing: () => void;
  openStudentVerify: () => void;
  openUserRoom: () => void;
  openLaunchNotice: () => void;
  closeLaunchNotice: () => void;
  navigateToWorkspace: (workspace: WorkspaceId, prompt?: string, imageUrl?: string) => void;
  goToHome: () => void;
  /** Starts a fresh chat in `workspaceId` and sends `content` there. */
  queuePrompt: (workspaceId: WorkspaceId, content: string, options?: Omit<PendingPrompt, 'workspaceId' | 'content'>) => void;
  /** Takes the pending prompt if it belongs to this shield. */
  consumePendingPrompt: (workspaceId: WorkspaceId) => PendingPrompt | null;

  requireAuth: (action: () => void) => void;
  /**
   * Enter SG16 without any account: starts an anonymous device session (no Google, no email),
   * then runs `action` or opens the AI chat. Chat history stays on this device.
   */
  startSession: (action?: () => void) => Promise<void>;
  setAuthSession: (token: string, user: AuthUser) => void;
  /** Public tour — open Shield Home without a session; shields start one when opened. */
  enterGuestTour: () => void;
  refreshAuthUser: () => Promise<void>;
  restoreAuthSession: () => Promise<void>;
  logout: () => void;
  wipeSession: () => void;

  selectPlan: (plan: PlanTier) => void;
  startCheckout: (plan: 'student' | 'pro') => Promise<void>;
  syncSubscriptionFromServer: () => Promise<void>;
  loadPublicConfig: () => Promise<void>;
  applyStudentVerification: (result: StudentVerifyResponse) => void;

  /**
   * Appends to `threadId`, else to the open thread, else starts a new thread.
   * Returns the thread id so a late AI reply lands in the conversation it belongs to.
   */
  addMessage: (workspaceId: WorkspaceId, message: Message, threadId?: string | null) => string;
  newThread: (workspaceId: WorkspaceId) => void;
  openThread: (workspaceId: WorkspaceId, threadId: string) => void;
  deleteThread: (workspaceId: WorkspaceId, threadId: string) => void;
  /** Deletes the open thread in this shield. */
  clearMessages: (workspaceId: WorkspaceId) => void;
  clearAllMessages: () => void;
  setBusy: (workspaceId: WorkspaceId, busy: boolean) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/** Chat history is stored on this device only — never sent to the server for storage. */
function persistThreads(threads: ChatThreads, userId?: string | null) {
  saveChatThreads(threads, userId);
}

const NO_MESSAGES: Message[] = [];

export function getActiveThread(
  state: Pick<AppState, 'threads' | 'activeThreadId'>,
  workspaceId: WorkspaceId,
): ChatThread | undefined {
  const id = state.activeThreadId[workspaceId];
  return id ? state.threads[workspaceId].find((t) => t.id === id) : undefined;
}

/** Stable selector: returns the same empty array when no thread is open. */
export function selectActiveMessages(
  state: Pick<AppState, 'threads' | 'activeThreadId'>,
  workspaceId: WorkspaceId,
): Message[] {
  return getActiveThread(state, workspaceId)?.messages ?? NO_MESSAGES;
}

/** Threads newest first. */
export function sortedThreads(list: ChatThread[]): ChatThread[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

const freshChatState = () => ({ threads: emptyChatThreads(), activeThreadId: {}, busy: {} });

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
  helpSection: 'overview',
  ...freshChatState(),
  settings: loadSettings(),
  subscription: loadSubscription(),
  authUser: null,
  authToken: loadAuthToken(),
  loading: false,
  error: null,
  launchFree: true,
  checkoutEnabled: false,
  launchMessage:
    'Launch period — all features are free unlimited. We will notify you in the app before paid plans begin.',
  launchNoticeOpen: false,
  stagingOpen: false,

  openStaging: () => set({ stagingOpen: true }),
  closeStaging: () => set({ stagingOpen: false }),

  startSession: async (action) => {
    try {
      const result = await loginDevice();
      getState().setAuthSession(result.token, result.user);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not start SG16. Please try again.' });
      return;
    }
    if (action) {
      action();
    } else if (getState().currentWorkspace === 'home') {
      getState().setWorkspace('general');
    }
  },

  requireAuth: (action) => {
    if (isAuthenticated(getState().authUser)) {
      action();
      return;
    }
    void getState().startSession(action);
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
    set({
      authToken: token,
      authUser: enriched,
      subscription,
      settings,
      // Saved chats go to history; every shield opens on a fresh chat.
      threads: loadChatThreads(enriched.id),
      activeThreadId: {},
      error: null,
      ...(user.launchFree !== undefined
        ? { launchFree: user.launchFree, checkoutEnabled: !user.launchFree }
        : {}),
    });
    queueMicrotask(() => void getState().syncSubscriptionFromServer());
  },

  enterGuestTour: () => {
    set({ currentWorkspace: 'home', error: null });
    pushAppPath('/app');
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
      if (err instanceof ApiError && err.unauthorized) {
        getState().logout();
      }
    }
  },

  restoreAuthSession: async () => {
    // A returning device renews its anonymous session silently; new visitors see the landing page.
    const resumeDevice = async () => {
      if (!hasDeviceId()) return;
      try {
        const result = await loginDevice();
        getState().setAuthSession(result.token, result.user);
      } catch {
        /* engine offline — the landing page and offline banner explain it */
      }
    };

    const token = loadAuthToken();
    if (!token || token.startsWith('local-preview') || !token.includes('.')) {
      if (token) clearAuthToken();
      set({ authToken: null, authUser: null, ...freshChatState() });
      await resumeDevice();
      return;
    }
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
        threads: loadChatThreads(user.id),
        activeThreadId: {},
        settings: { ...getState().settings, displayName: user.name },
      });
    } catch (err) {
      // Only a rejected token ends the session; if the engine is unreachable, keep it for the next load.
      const offline = err instanceof ApiError && err.offline;
      if (!offline) clearAuthToken();
      set({ authToken: null, authUser: null, ...freshChatState() });
      if (!offline) await resumeDevice();
    }
  },

  logout: () => {
    const userId = getState().authUser?.id;
    persistThreads(getState().threads, userId);
    clearAuthToken();
    clearAllMemories();
    clearSessionSettings();
    pushAppPath('/', true);
    set({
      authUser: null,
      authToken: null,
      currentWorkspace: 'home',
      ...freshChatState(),
    });
  },

  wipeSession: () => {
    const userId = getState().authUser?.id;
    clearSessionData(userId);
    set(freshChatState());
  },

  setWorkspace: (ws) => {
    const { subscription, authUser } = getState();
    if (ws === 'pricing' || ws === 'student-verify' || ws === 'home' || ws === 'user-room' || ws === 'history' || ws === 'settings' || ws === 'help') {
      set({ currentWorkspace: ws, error: null });
      const path = routeToPath(ws);
      if (path) pushAppPath(path);
      return;
    }
    tryOpenWorkspace(ws, subscription, authUser, set, getState().startSession, () =>
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
    pushAppPath('/app');
  },

  navigateToWorkspace: (workspace, prompt, imageUrl) => {
    const run = () => {
      const { subscription, authUser } = getState();
      if (prompt || imageUrl) {
        getState().queuePrompt(workspace, prompt || 'Analyze this image', { imageUrl });
      }
      if (canAccessWorkspace(workspace, subscription, authUser)) {
        set({ currentWorkspace: workspace, error: null });
        return;
      }
      if (subscription.plan === 'student') {
        set({ currentWorkspace: 'student-verify', error: null });
        return;
      }
      set({ currentWorkspace: 'pricing', error: null });
    };

    getState().requireAuth(run);
  },

  queuePrompt: (workspaceId, content, options) =>
    set((state) => ({
      pendingPrompt: { workspaceId, content, ...options },
      pendingPromptToken: Date.now(),
      activeThreadId: { ...state.activeThreadId, [workspaceId]: null },
    })),

  consumePendingPrompt: (workspaceId) => {
    const pending = getState().pendingPrompt;
    if (!pending || pending.workspaceId !== workspaceId) return null;
    set({ pendingPrompt: null });
    return pending;
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

  addMessage: (workspaceId, message, threadId) => {
    const state = getState();
    const list = state.threads[workspaceId];
    const targetId = threadId ?? state.activeThreadId[workspaceId] ?? null;
    const existing = targetId ? list.find((t) => t.id === targetId) : undefined;
    // The user deleted this conversation while its reply was pending — drop the reply.
    if (threadId && !existing) return threadId;
    const now = message.timestamp || Date.now();

    let nextList: ChatThread[];
    let id: string;
    if (existing) {
      id = existing.id;
      nextList = list.map((t) =>
        t.id === id ? { ...t, updatedAt: now, messages: [...t.messages, message] } : t,
      );
    } else {
      id = uid();
      nextList = [
        { id, title: threadTitle(message), createdAt: now, updatedAt: now, messages: [message] },
        ...list,
      ];
    }

    const threads = { ...state.threads, [workspaceId]: nextList };
    set({
      threads,
      ...(existing ? {} : { activeThreadId: { ...state.activeThreadId, [workspaceId]: id } }),
    });
    persistThreads(threads, state.authUser?.id);
    return id;
  },

  newThread: (workspaceId) =>
    set((state) => ({ activeThreadId: { ...state.activeThreadId, [workspaceId]: null }, error: null })),

  openThread: (workspaceId, threadId) =>
    set((state) => ({ activeThreadId: { ...state.activeThreadId, [workspaceId]: threadId }, error: null })),

  deleteThread: (workspaceId, threadId) =>
    set((state) => {
      const threads = {
        ...state.threads,
        [workspaceId]: state.threads[workspaceId].filter((t) => t.id !== threadId),
      };
      persistThreads(threads, state.authUser?.id);
      const wasActive = state.activeThreadId[workspaceId] === threadId;
      return {
        threads,
        ...(wasActive ? { activeThreadId: { ...state.activeThreadId, [workspaceId]: null } } : {}),
      };
    }),

  clearMessages: (workspaceId) => {
    const id = getState().activeThreadId[workspaceId];
    if (id) getState().deleteThread(workspaceId, id);
  },

  clearAllMessages: () =>
    set((state) => {
      persistThreads(emptyChatThreads(), state.authUser?.id);
      return { threads: emptyChatThreads(), activeThreadId: {} };
    }),

  setBusy: (workspaceId, busy) =>
    set((state) => ({ busy: { ...state.busy, [workspaceId]: busy } })),

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
    const { threads, authUser } = useAppStore.getState();
    persistThreads(threads, authUser?.id);
  });
}

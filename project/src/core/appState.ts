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
import {
  adoptOpenConversations,
  loadThreads,
  saveThreads,
  upsertThread,
  type ChatThread,
  type ThreadState,
} from '../lib/chatThreads';

/** Last known state of the AI, from real chat replies (Shield Home status bar). */
export type AiStatus = 'unknown' | 'ok' | 'busy' | 'offline';

interface AppState {
  currentWorkspace: WorkspaceType;
  pendingPrompt: string | null;
  pendingPromptToken: number;
  pendingImageUrl: string | null;
  helpSection: HelpSection;
  messages: Record<WorkspaceId, Message[]>;
  /** Saved conversations on this device (the open one of each shield included). */
  chatThreads: ChatThread[];
  activeThreadIds: Partial<Record<WorkspaceId, string>>;
  /** Set when History or Pilot asks a shield to open straight into its chat. */
  openChatFor: WorkspaceId | null;
  aiStatus: AiStatus;
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
  /** Back to the previous screen (Shield Home when there is none). */
  goBack: () => void;
  /** Public homepage (/). The session stays; Enter or Start Tour returns to Shield Home. */
  goToPublicHome: () => void;
  consumePendingPrompt: () => string | null;
  consumePendingImage: () => string | null;

  requireAuth: (action: () => void) => void;
  /**
   * Enter SG16 without any account: starts an anonymous device session (no Google, no email),
   * then runs `action` or opens Shield Home. Chat history stays on this device.
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

  addMessage: (workspaceId: WorkspaceId, message: Message) => void;
  /** Delete the open conversation of a shield. */
  clearMessages: (workspaceId: WorkspaceId) => void;
  /** Start a fresh conversation; the current one stays in History. */
  newChat: (workspaceId: WorkspaceId) => void;
  openThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  /** Open a shield in its chat view, optionally sending a prompt. */
  openShieldChat: (workspaceId: WorkspaceId, prompt?: string) => void;
  consumeOpenChat: (workspaceId: WorkspaceId) => boolean;
  setAiStatus: (status: AiStatus) => void;
  clearAllMessages: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/** Screens visited in this tab, for the side panel's Back button. */
const backStack: WorkspaceType[] = [];
let goingBack = false;

/** Chat history is stored on this device only — never sent to the server for storage. */
function persistMessages(messages: AppState['messages'], userId?: string | null) {
  saveChatHistory(messages, userId);
}

function threadState(state: Pick<AppState, 'chatThreads' | 'activeThreadIds'>): ThreadState {
  return { threads: state.chatThreads, active: state.activeThreadIds };
}

function persistThreads(state: ThreadState, userId?: string | null) {
  saveThreads(state, userId);
  return { chatThreads: state.threads, activeThreadIds: state.active };
}

/** Everything a signed-in device has saved: open conversations + History. */
function loadConversations(userId?: string | null) {
  const messages = loadChatHistory(userId);
  const threads = adoptOpenConversations(loadThreads(userId), messages);
  return { messages, chatThreads: threads.threads, activeThreadIds: threads.active };
}

const NO_CONVERSATIONS = () => ({
  messages: emptyChatHistory(),
  chatThreads: [] as ChatThread[],
  activeThreadIds: {},
});

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
  chatThreads: [],
  activeThreadIds: {},
  openChatFor: null,
  aiStatus: 'unknown',
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
      // Shield Home is the work homepage — land there, the user picks a shield.
      getState().setWorkspace('home');
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
      ...loadConversations(enriched.id),
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
      set({ authToken: null, authUser: null, ...NO_CONVERSATIONS() });
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
        ...loadConversations(user.id),
        settings: { ...getState().settings, displayName: user.name },
      });
    } catch (err) {
      // Only a rejected token ends the session; if the engine is unreachable, keep it for the next load.
      const offline = err instanceof ApiError && err.offline;
      if (!offline) clearAuthToken();
      set({ authToken: null, authUser: null, ...NO_CONVERSATIONS() });
      if (!offline) await resumeDevice();
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
      currentWorkspace: 'home',
      ...NO_CONVERSATIONS(),
    });
  },

  wipeSession: () => {
    const userId = getState().authUser?.id;
    clearSessionData(userId);
    saveThreads({ threads: [], active: {} }, userId);
    set(NO_CONVERSATIONS());
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

  goBack: () => {
    const target = backStack.pop() ?? 'home';
    goingBack = true;
    if (target === 'home') getState().goToHome();
    else getState().setWorkspace(target);
    goingBack = false;
  },

  goToPublicHome: () => {
    backStack.length = 0;
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
      return {
        messages,
        ...persistThreads(upsertThread(threadState(state), workspaceId, messages[workspaceId]), state.authUser?.id),
      };
    }),

  clearMessages: (workspaceId) =>
    set((state) => {
      const activeId = state.activeThreadIds[workspaceId];
      const messages = { ...state.messages, [workspaceId]: [] };
      persistMessages(messages, state.authUser?.id);
      const active = { ...state.activeThreadIds };
      delete active[workspaceId];
      return {
        messages,
        ...persistThreads(
          { threads: state.chatThreads.filter((t) => t.id !== activeId), active },
          state.authUser?.id,
        ),
      };
    }),

  newChat: (workspaceId) =>
    set((state) => {
      const messages = { ...state.messages, [workspaceId]: [] };
      persistMessages(messages, state.authUser?.id);
      const active = { ...state.activeThreadIds };
      delete active[workspaceId];
      return { messages, ...persistThreads({ threads: state.chatThreads, active }, state.authUser?.id) };
    }),

  openThread: (threadId) => {
    const state = getState();
    const thread = state.chatThreads.find((t) => t.id === threadId);
    if (!thread) return;
    const messages = { ...state.messages, [thread.workspaceId]: thread.messages };
    persistMessages(messages, state.authUser?.id);
    set({
      messages,
      ...persistThreads(
        { threads: state.chatThreads, active: { ...state.activeThreadIds, [thread.workspaceId]: thread.id } },
        state.authUser?.id,
      ),
    });
    if (state.currentWorkspace !== thread.workspaceId) getState().openShieldChat(thread.workspaceId);
    else set({ openChatFor: thread.workspaceId });
  },

  deleteThread: (threadId) => {
    const state = getState();
    const thread = state.chatThreads.find((t) => t.id === threadId);
    if (!thread) return;
    if (state.activeThreadIds[thread.workspaceId] === threadId) {
      getState().clearMessages(thread.workspaceId);
      return;
    }
    set(
      persistThreads(
        { threads: state.chatThreads.filter((t) => t.id !== threadId), active: state.activeThreadIds },
        state.authUser?.id,
      ),
    );
  },

  openShieldChat: (workspaceId, prompt) => {
    getState().requireAuth(() => {
      set({
        openChatFor: workspaceId,
        ...(prompt ? { pendingPrompt: prompt, pendingPromptToken: Date.now() } : {}),
      });
      if (getState().currentWorkspace !== workspaceId) getState().setWorkspace(workspaceId);
    });
  },

  consumeOpenChat: (workspaceId) => {
    if (getState().openChatFor !== workspaceId) return false;
    set({ openChatFor: null });
    return true;
  },

  setAiStatus: (aiStatus) => {
    if (getState().aiStatus !== aiStatus) set({ aiStatus });
  },

  clearAllMessages: () =>
    set((state) => {
      persistMessages(emptyChatHistory(), state.authUser?.id);
      return { messages: emptyChatHistory(), ...persistThreads({ threads: [], active: {} }, state.authUser?.id) };
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

useAppStore.subscribe((state, prev) => {
  if (state.currentWorkspace === prev.currentWorkspace) return;
  // Shields have no address of their own: leave /pricing, /room… for /app so a refresh
  // does not reopen the page the user already left.
  if (!routeToPath(state.currentWorkspace) && typeof window !== 'undefined' && window.location.pathname !== '/') {
    pushAppPath('/app');
  }
  if (goingBack) return;
  backStack.push(prev.currentWorkspace);
  if (backStack.length > 20) backStack.shift();
});

if (typeof window !== 'undefined') {
  queueMicrotask(() => {
    void useAppStore.getState().loadPublicConfig();
  });

  window.addEventListener('beforeunload', () => {
    const { messages, authUser } = useAppStore.getState();
    persistMessages(messages, authUser?.id);
  });
}

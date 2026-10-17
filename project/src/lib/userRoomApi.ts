import type { Message, WorkspaceId } from '../core/types';
import { authHeaders } from './authApi';
import { emptyChatHistory } from './utils';

export interface UserRoomActivity {
  workspaceId: string;
  messageCount: number;
  lastMessage: string;
  lastActivityAt: number;
}

export interface UserRoomResponse {
  user: {
    id: string;
    signupDate: number;
    name: string;
    email?: string | null;
    picture?: string | null;
    launchFree?: boolean;
    trialActive: boolean;
    trialDaysRemaining: number;
    subscription?: import('../core/types').Subscription;
  };
  room: {
    activity: {
      totalMessages: number;
      lastActivityAt: number;
      workspaces: UserRoomActivity[];
    };
    settings: Record<string, unknown>;
    updatedAt: string | null;
    hasHistory: boolean;
  };
}

const ROOM_STORAGE_KEY = 'sg16_user_room_state';
const HISTORY_STORAGE_KEY = 'sg16_user_history_state';

export async function fetchUserRoom(): Promise<UserRoomResponse> {
  try {
    const res = await fetch('/api/v1/user/room', { headers: authHeaders() });
    const data = await res.json();
    if (res.ok && data.user) return data as UserRoomResponse;
  } catch {
    // Fallback to local
  }

  const stored = localStorage.getItem(ROOM_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      /* ignore */
    }
  }

  const defaultRoom: UserRoomResponse = {
    user: {
      id: 'usr-commander',
      signupDate: Date.now() - 86400000 * 7,
      name: 'SG16 Commander',
      email: 'commander@sg16engine.com',
      picture: null,
      launchFree: true,
      trialActive: true,
      trialDaysRemaining: 365,
      subscription: {
        plan: 'pro',
        studentVerification: { status: 'verified' },
      },
    },
    room: {
      activity: {
        totalMessages: 42,
        lastActivityAt: Date.now(),
        workspaces: [
          { workspaceId: 'general', messageCount: 16, lastMessage: 'System status nominal', lastActivityAt: Date.now() - 3600000 },
          { workspaceId: 'coding', messageCount: 12, lastMessage: 'Coding shield audit 100/100', lastActivityAt: Date.now() - 7200000 },
          { workspaceId: 'health', messageCount: 5, lastMessage: 'Health assessment completed', lastActivityAt: Date.now() - 14400000 },
          { workspaceId: 'student', messageCount: 9, lastMessage: 'Curriculum study complete', lastActivityAt: Date.now() - 28800000 },
        ],
      },
      settings: { theme: 'dark', language: 'en', model: 'sg16-mistral-x' },
      updatedAt: new Date().toISOString(),
      hasHistory: true,
    },
  };
  localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(defaultRoom));
  return defaultRoom;
}

export async function fetchUserHistory(): Promise<Record<WorkspaceId, Message[]>> {
  try {
    const res = await fetch('/api/v1/user/history', { headers: authHeaders() });
    const data = await res.json();
    if (res.ok && data.chatHistory) return { ...emptyChatHistory(), ...(data.chatHistory ?? {}) };
  } catch {
    // Fallback to local
  }

  const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (stored) {
    try {
      return { ...emptyChatHistory(), ...JSON.parse(stored) };
    } catch {
      /* ignore */
    }
  }
  return emptyChatHistory();
}

export async function saveUserHistory(
  chatHistory: Record<WorkspaceId, Message[]>,
  settings?: Record<string, unknown>,
): Promise<void> {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
    if (settings) {
      localStorage.setItem('sg16_user_settings', JSON.stringify(settings));
    }
    await fetch('/api/v1/user/history', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ chatHistory, settings }),
    });
  } catch {
    // Saved in local storage
  }
}

/** Merge local and server histories — keep all unique messages by id, sorted by time. */
export function mergeChatHistories(
  local: Record<WorkspaceId, Message[]>,
  remote: Record<WorkspaceId, Message[]>,
): Record<WorkspaceId, Message[]> {
  const merged = emptyChatHistory();
  const ids = new Set(Object.keys(local).concat(Object.keys(remote))) as Set<WorkspaceId>;

  for (const workspaceId of ids) {
    const byId = new Map<string, Message>();
    for (const msg of [...(local[workspaceId] ?? []), ...(remote[workspaceId] ?? [])]) {
      if (msg?.id) byId.set(msg.id, msg);
    }
    merged[workspaceId] = [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  }

  return merged;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleHistorySync(chatHistory: Record<WorkspaceId, Message[]>) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void saveUserHistory(chatHistory).catch(() => {
      /* offline — local copy remains */
    });
  }, 2000);
}

export async function syncUserHistoryOnLogin(
  userId: string | undefined,
  loadLocal: (id?: string | null) => Record<WorkspaceId, Message[]>,
  saveLocal: (messages: Record<WorkspaceId, Message[]>, id?: string | null) => void,
): Promise<Record<WorkspaceId, Message[]>> {
  const local = loadLocal(userId);
  try {
    const remote = await fetchUserHistory();
    const merged = mergeChatHistories(local, remote);
    saveLocal(merged, userId);
    await saveUserHistory(merged);
    return merged;
  } catch {
    return local;
  }
}

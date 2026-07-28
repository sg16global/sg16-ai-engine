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

export async function fetchUserRoom(): Promise<UserRoomResponse> {
  const res = await fetch('/api/v1/user/room', { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load user room');
  return data as UserRoomResponse;
}

export async function fetchUserHistory(): Promise<Record<WorkspaceId, Message[]>> {
  const res = await fetch('/api/v1/user/history', { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load history');
  return { ...emptyChatHistory(), ...(data.chatHistory ?? {}) };
}

export async function saveUserHistory(
  chatHistory: Record<WorkspaceId, Message[]>,
  settings?: Record<string, unknown>,
): Promise<void> {
  const res = await fetch('/api/v1/user/history', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ chatHistory, settings }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not save history');
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

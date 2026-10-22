import type { Message, WorkspaceId } from '../core/types';
import { uid } from './utils';

/** One saved conversation. The open conversation of each shield is also kept here, so History always lists it. */
export interface ChatThread {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  updatedAt: number;
  messages: Message[];
}

export interface ThreadState {
  threads: ChatThread[];
  active: Partial<Record<WorkspaceId, string>>;
}

const KEY_PREFIX = 'sg16_threads_device';
const MAX_THREADS = 60;

const storageKey = (userId?: string | null) => `${KEY_PREFIX}_${userId || 'guest'}`;

export function threadTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user')?.content.trim() ?? 'New chat';
  const line = first.split('\n')[0];
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}

export function loadThreads(userId?: string | null): ThreadState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as ThreadState;
      return { threads: parsed.threads ?? [], active: parsed.active ?? {} };
    }
  } catch {
    /* bad data — start empty */
  }
  return { threads: [], active: {} };
}

export function saveThreads(state: ThreadState, userId?: string | null) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    /* storage full — keep in memory */
  }
}

/**
 * Older builds kept only one conversation per shield. Turn any of those into threads
 * so nothing a user wrote disappears.
 */
export function adoptOpenConversations(
  state: ThreadState,
  messages: Record<WorkspaceId, Message[]>,
): ThreadState {
  let { threads } = state;
  const active = { ...state.active };
  for (const ws of Object.keys(messages) as WorkspaceId[]) {
    const msgs = messages[ws];
    if (!msgs?.length || (active[ws] && threads.some((t) => t.id === active[ws]))) continue;
    const thread: ChatThread = {
      id: uid(),
      workspaceId: ws,
      title: threadTitle(msgs),
      updatedAt: msgs[msgs.length - 1]?.timestamp ?? Date.now(),
      messages: msgs,
    };
    threads = [thread, ...threads];
    active[ws] = thread.id;
  }
  return { threads, active };
}

/** Insert or refresh the open conversation of a shield (newest first, capped). */
export function upsertThread(
  state: ThreadState,
  workspaceId: WorkspaceId,
  messages: Message[],
): ThreadState {
  const id = state.active[workspaceId] ?? uid();
  const thread: ChatThread = {
    id,
    workspaceId,
    title: threadTitle(messages),
    updatedAt: Date.now(),
    messages,
  };
  const others = state.threads.filter((t) => t.id !== id);
  return {
    threads: [thread, ...others].slice(0, MAX_THREADS),
    active: { ...state.active, [workspaceId]: id },
  };
}

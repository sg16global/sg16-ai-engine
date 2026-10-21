import type { ChatThread } from '../core/types';

export interface ShieldActivity {
  conversations: number;
  questions: number;
  lastActive: string;
  lastActiveHint: string;
}

/** Real usage numbers for a shield, counted from its chats on this device. */
export function shieldActivity(threads: ChatThread[]): ShieldActivity {
  const questions = threads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.role === 'user').length,
    0,
  );
  const last = threads.reduce((max, t) => Math.max(max, t.updatedAt), 0);
  if (!last) {
    return { conversations: 0, questions: 0, lastActive: '—', lastActiveHint: 'no chats yet' };
  }
  const d = new Date(last);
  const today = d.toDateString() === new Date().toDateString();
  return {
    conversations: threads.length,
    questions,
    lastActive: today ? 'Today' : d.toLocaleDateString(),
    lastActiveHint: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

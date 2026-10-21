import type { MemoryEntry, Message, Subscription, WorkspaceId } from '../core/types';
import { defaultSubscription } from '../core/access';

const MEMORY_KEY = 'sg16_memory_session';
const SETTINGS_KEY = 'sg16_settings_session';
const SUBSCRIPTION_KEY = 'sg16_subscription';

export interface AppSettings {
  displayName: string;
  autoSendVoice: boolean;
}

const defaultSettings: AppSettings = {
  displayName: 'SG16 User',
  autoSendVoice: true,
};

/** In-memory only — never persisted to disk (privacy protocol). */
export function emptyChatHistory(): Record<WorkspaceId, Message[]> {
  return {
    general: [],
    coding: [],
    health: [],
    'student-shield': [],
    market: [],
    image: [],
    translate: [],
    document: [],
    voice: [],
    memory: [],
  };
}

export function loadSettings(): AppSettings {
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearSessionSettings() {
  sessionStorage.removeItem(SETTINGS_KEY);
}

export function loadSubscription(): Subscription {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    return raw ? { ...defaultSubscription(), ...JSON.parse(raw) } : defaultSubscription();
  } catch {
    return defaultSubscription();
  }
}

export function saveSubscription(subscription: Subscription) {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
}

const CHAT_KEY_PREFIX = 'sg16_chat_device';

function chatStorageKey(userId?: string | null) {
  return userId ? `${CHAT_KEY_PREFIX}_${userId}` : `${CHAT_KEY_PREFIX}_guest`;
}

/** Device cache + synced to user room on the server when signed in. */
export function saveChatHistory(messages: Record<WorkspaceId, Message[]>, userId?: string | null) {
  try {
    localStorage.setItem(chatStorageKey(userId), JSON.stringify(messages));
  } catch {
    /* storage full — keep in-memory session */
  }
}

export function loadChatHistory(userId?: string | null): Record<WorkspaceId, Message[]> {
  try {
    const raw = localStorage.getItem(chatStorageKey(userId));
    if (!raw) return emptyChatHistory();
    const parsed = JSON.parse(raw) as Partial<Record<WorkspaceId, Message[]>>;
    return { ...emptyChatHistory(), ...parsed };
  } catch {
    return emptyChatHistory();
  }
}

export function clearChatHistoryForUser(userId?: string | null) {
  localStorage.removeItem(chatStorageKey(userId));
}

export function clearAllChatHistory(userId?: string | null) {
  clearChatHistoryForUser(userId);
}

export function clearAllMemories() {
  sessionStorage.removeItem(MEMORY_KEY);
}

export function loadMemories(): MemoryEntry[] {
  try {
    const raw = sessionStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMemory(title: string, content: string): MemoryEntry {
  const entries = loadMemories();
  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    title: title.slice(0, 80) || 'Untitled',
    content,
    createdAt: Date.now(),
  };
  entries.unshift(entry);
  sessionStorage.setItem(MEMORY_KEY, JSON.stringify(entries.slice(0, 100)));
  return entry;
}

export function deleteMemory(id: string) {
  const entries = loadMemories().filter((e) => e.id !== id);
  sessionStorage.setItem(MEMORY_KEY, JSON.stringify(entries));
}

export function formatMemoryContext(): string {
  const entries = loadMemories();
  if (!entries.length) return '';
  return entries
    .slice(0, 20)
    .map((e) => `- ${e.title}: ${e.content}`)
    .join('\n');
}

export function clearSessionData(userId?: string | null) {
  clearAllChatHistory(userId);
  clearAllMemories();
  clearSessionSettings();
}

export function uid(): string {
  return crypto.randomUUID();
}

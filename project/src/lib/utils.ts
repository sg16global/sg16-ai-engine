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
    image: [],
    'student-shield': [],
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

/** @deprecated Chat is session-only — no-op for compatibility */
export function saveChatHistory(_messages: Record<WorkspaceId, Message[]>) {}

/** @deprecated Returns empty history — messages live in memory only */
export function loadChatHistory(): Record<WorkspaceId, Message[]> {
  return emptyChatHistory();
}

export function clearAllChatHistory() {}

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

export function clearSessionData() {
  clearAllChatHistory();
  clearAllMemories();
  clearSessionSettings();
}

export function uid(): string {
  return crypto.randomUUID();
}

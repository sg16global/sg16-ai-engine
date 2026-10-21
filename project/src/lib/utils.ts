import type { ChatThread, ChatThreads, MemoryEntry, Message, Subscription, WorkspaceId } from '../core/types';
import { defaultSubscription } from '../core/access';

/** Memory Vault notes live on this device (like chats) so they survive closing the tab. */
const MEMORY_KEY = 'sg16_memory_device';
const LEGACY_MEMORY_KEY = 'sg16_memory_session';
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

/** v1 stored one flat message list per shield; v2 stores separate threads. */
const LEGACY_CHAT_KEY_PREFIX = 'sg16_chat_device';
const THREADS_KEY_PREFIX = 'sg16_threads_device';
const MAX_THREADS_PER_SHIELD = 50;

function storageSuffix(userId?: string | null) {
  return userId ? `_${userId}` : '_guest';
}

export function emptyChatThreads(): ChatThreads {
  const empty = emptyChatHistory();
  return Object.fromEntries(Object.keys(empty).map((id) => [id, []])) as unknown as ChatThreads;
}

/** One-line plain text for previews — drops Markdown marks, keeps link labels. */
export function plainPreview(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function threadTitle(message: Pick<Message, 'content' | 'display'>): string {
  const source = (message.display ?? message.content).trim();
  const text = (source.split('\n')[0] || source).replace(/\s+/g, ' ').trim();
  if (!text) return 'New chat';
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function threadFromLegacy(messages: Message[]): ChatThread | null {
  if (!messages.length) return null;
  const firstUser = messages.find((m) => m.role === 'user') ?? messages[0];
  return {
    id: crypto.randomUUID(),
    title: threadTitle(firstUser),
    createdAt: messages[0].timestamp || Date.now(),
    updatedAt: messages[messages.length - 1].timestamp || Date.now(),
    messages,
  };
}

/** Chat history lives on this device only — the server never stores it. */
export function saveChatThreads(threads: ChatThreads, userId?: string | null) {
  try {
    const trimmed = Object.fromEntries(
      Object.entries(threads).map(([id, list]) => [
        id,
        [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_THREADS_PER_SHIELD),
      ]),
    );
    localStorage.setItem(`${THREADS_KEY_PREFIX}${storageSuffix(userId)}`, JSON.stringify(trimmed));
  } catch {
    /* storage full — keep in-memory session */
  }
}

export function loadChatThreads(userId?: string | null): ChatThreads {
  const threads = emptyChatThreads();
  try {
    const raw = localStorage.getItem(`${THREADS_KEY_PREFIX}${storageSuffix(userId)}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ChatThreads>;
      for (const id of Object.keys(threads) as WorkspaceId[]) {
        const list = parsed[id];
        if (Array.isArray(list)) threads[id] = list.filter((t) => t && Array.isArray(t.messages));
      }
      return threads;
    }

    // One-time move from the v1 flat history: each shield's old messages become one thread.
    const legacyKey = `${LEGACY_CHAT_KEY_PREFIX}${storageSuffix(userId)}`;
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<Record<WorkspaceId, Message[]>>;
      for (const id of Object.keys(threads) as WorkspaceId[]) {
        const thread = threadFromLegacy(Array.isArray(legacy[id]) ? legacy[id]! : []);
        if (thread) threads[id] = [thread];
      }
      saveChatThreads(threads, userId);
      localStorage.removeItem(legacyKey);
    }
  } catch {
    return emptyChatThreads();
  }
  return threads;
}

export function clearChatHistoryForUser(userId?: string | null) {
  localStorage.removeItem(`${THREADS_KEY_PREFIX}${storageSuffix(userId)}`);
  localStorage.removeItem(`${LEGACY_CHAT_KEY_PREFIX}${storageSuffix(userId)}`);
}

export function clearAllChatHistory(userId?: string | null) {
  clearChatHistoryForUser(userId);
}

export function clearAllMemories() {
  localStorage.removeItem(MEMORY_KEY);
  sessionStorage.removeItem(LEGACY_MEMORY_KEY);
}

function writeMemories(entries: MemoryEntry[]) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(entries.slice(0, 100)));
  } catch {
    /* storage full */
  }
}

export function loadMemories(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = sessionStorage.getItem(LEGACY_MEMORY_KEY);
    if (!legacy) return [];
    const entries = JSON.parse(legacy) as MemoryEntry[];
    writeMemories(entries);
    sessionStorage.removeItem(LEGACY_MEMORY_KEY);
    return entries;
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
  writeMemories(entries);
  return entry;
}

export function deleteMemory(id: string) {
  writeMemories(loadMemories().filter((e) => e.id !== id));
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

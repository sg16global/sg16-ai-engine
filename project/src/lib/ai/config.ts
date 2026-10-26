import type { AiConfig, AiGenerationOptions, AiProviderConfig, AiProviderModels } from './types';

/**
 * AI configuration — load/save/validate plus the fallback-chain helpers.
 * Config lives in this device's localStorage (there is no server to hold it);
 * build-time defaults come from raw VITE_SG16_AI_* env vars.
 *
 * There are no presets and no known-provider list: a connection is raw
 * values only (name, base URL, API key, model strings).
 */

export const AI_CONFIG_STORAGE_KEY = 'sg16_ai_config_v1';

export const DEFAULT_GENERATION_OPTIONS: AiGenerationOptions = {
  temperature: null,
  maxTokens: null,
  liveSearch: true,
};

export function defaultConfig(): AiConfig {
  return {
    providers: [],
    activeProviderId: null,
    options: { ...DEFAULT_GENERATION_OPTIONS },
    updatedAt: Date.now(),
  };
}

function uid(): string {
  return crypto.randomUUID();
}

/**
 * Create a raw provider connection from user-entered values (Admin panel).
 * No preset lookup, no defaults beyond empty strings — what you type is what
 * gets stored and sent.
 */
export function createProvider(raw: {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  requiresKey?: boolean;
  models: Partial<AiProviderModels>;
  headers?: Record<string, string>;
  priority?: number;
  enabled?: boolean;
}): AiProviderConfig {
  return {
    id: raw.id ?? uid(),
    name: raw.name.trim() || 'Custom endpoint',
    baseUrl: raw.baseUrl.trim().replace(/\/+$/, ''),
    apiKey: raw.apiKey?.trim() ?? '',
    models: {
      chat: raw.models.chat?.trim() ?? '',
      coding: raw.models.coding?.trim() ?? '',
      vision: raw.models.vision?.trim() ?? '',
      audio: raw.models.audio?.trim() ?? '',
      image: raw.models.image?.trim() ?? '',
      fallbacks: (raw.models.fallbacks ?? []).map((m) => m.trim()).filter(Boolean),
    },
    enabled: raw.enabled ?? true,
    priority: raw.priority ?? 0,
    requiresKey: raw.requiresKey ?? true,
    headers: raw.headers,
  };
}

/** A connection is usable when it is enabled, has a base URL and (when required) a key and a chat model. */
export function isProviderUsable(provider: AiProviderConfig): boolean {
  if (!provider.enabled) return false;
  if (!provider.baseUrl.trim()) return false;
  if (provider.requiresKey && !provider.apiKey.trim()) return false;
  return Boolean(provider.models.chat.trim());
}

/** Enabled connections, primary first. This is the fallback chain order. */
export function providerChain(providers: AiProviderConfig[]): AiProviderConfig[] {
  return providers
    .filter((p) => p.enabled)
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export function activeProvider(providers: AiProviderConfig[], activeId: string | null): AiProviderConfig | null {
  const chain = providerChain(providers);
  if (!chain.length) return null;
  return chain.find((p) => p.id === activeId) ?? chain[0];
}

/** Resolve which model slot serves an intent for a connection. */
export function modelForIntent(provider: AiProviderConfig, intent: 'chat' | 'code' | 'vision' | 'reasoning'): string {
  const m = provider.models;
  if (intent === 'vision') return m.vision || m.chat;
  if (intent === 'code') return m.coding || m.chat;
  return m.chat;
}

/* ── Persistence ── */

function sanitizeProvider(raw: unknown): AiProviderConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== 'string' || !p.id) return null;
  const models = (p.models ?? {}) as Record<string, unknown>;
  const fallbacks = Array.isArray(models.fallbacks) ? models.fallbacks.filter((m): m is string => typeof m === 'string') : [];
  const headers =
    p.headers && typeof p.headers === 'object'
      ? Object.fromEntries(Object.entries(p.headers as Record<string, unknown>).filter(([, v]) => typeof v === 'string')) as Record<string, string>
      : undefined;
  return {
    id: p.id,
    name: typeof p.name === 'string' && p.name.trim() ? p.name : 'Custom endpoint',
    baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl.trim().replace(/\/+$/, '') : '',
    apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
    models: {
      chat: typeof models.chat === 'string' ? models.chat : '',
      coding: typeof models.coding === 'string' ? models.coding : '',
      vision: typeof models.vision === 'string' ? models.vision : '',
      audio: typeof models.audio === 'string' ? models.audio : '',
      image: typeof models.image === 'string' ? models.image : '',
      fallbacks,
    },
    enabled: p.enabled !== false,
    priority: typeof p.priority === 'number' && Number.isFinite(p.priority) ? p.priority : 0,
    requiresKey: p.requiresKey !== false,
    headers,
  };
}

export function sanitizeConfig(raw: unknown): AiConfig {
  const config = defaultConfig();
  if (!raw || typeof raw !== 'object') return config;
  const c = raw as Record<string, unknown>;
  const providers = Array.isArray(c.providers) ? c.providers.map(sanitizeProvider).filter((p): p is AiProviderConfig => p !== null) : [];
  // Unique priorities so the chain order is deterministic.
  providers.sort((a, b) => a.priority - b.priority);
  providers.forEach((p, i) => {
    if (providers.some((q, j) => j < i && q.priority === p.priority)) p.priority = i;
  });
  const options = (c.options ?? {}) as Record<string, unknown>;
  config.providers = providers;
  config.options = {
    temperature: typeof options.temperature === 'number' ? options.temperature : null,
    maxTokens: typeof options.maxTokens === 'number' ? options.maxTokens : null,
    liveSearch: options.liveSearch !== false,
  };
  config.activeProviderId = typeof c.activeProviderId === 'string' ? c.activeProviderId : null;
  config.updatedAt = typeof c.updatedAt === 'number' ? c.updatedAt : Date.now();
  return config;
}

/** First-run config from build-time env vars (raw values, no presets). */
export function envConfig(): AiConfig {
  const config = defaultConfig();
  const env = import.meta.env;
  const baseUrl = (env.VITE_SG16_AI_BASE_URL ?? '').trim();
  const model = (env.VITE_SG16_AI_MODEL ?? '').trim();
  if (!baseUrl || !model) return config;
  const apiKey = (env.VITE_SG16_AI_API_KEY ?? '').trim();
  const provider = createProvider({
    name: (env.VITE_SG16_AI_NAME ?? '').trim() || 'Build-time endpoint',
    baseUrl,
    apiKey,
    requiresKey: Boolean(apiKey),
    models: {
      chat: model,
      coding: (env.VITE_SG16_AI_CODING_MODEL ?? '').trim(),
      vision: (env.VITE_SG16_AI_VISION_MODEL ?? '').trim(),
      audio: '',
      image: '',
      fallbacks: [],
    },
    priority: 0,
  });
  config.providers = [provider];
  config.activeProviderId = provider.id;
  if ((env.VITE_SG16_LIVE_SEARCH ?? '').trim() === '0') config.options.liveSearch = false;
  return config;
}

export function loadConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (raw) return sanitizeConfig(JSON.parse(raw));
  } catch {
    /* corrupted or unavailable storage — fall through to env defaults */
  }
  return envConfig();
}

export function saveConfig(config: AiConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({ ...config, updatedAt: Date.now() }));
  } catch {
    /* private mode — the in-memory store still works for this session */
  }
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function exportConfigJson(config: AiConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importConfigJson(json: string): AiConfig {
  const parsed: unknown = JSON.parse(json);
  const config = sanitizeConfig(parsed);
  if (!config.providers.length) {
    throw new Error('No providers found in this config.');
  }
  return config;
}

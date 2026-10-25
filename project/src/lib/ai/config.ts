import { getPreset } from './presets';
import type { AiConfig, AiGenerationOptions, AiProviderConfig } from './types';

/**
 * AI configuration — load/save/validate plus the fallback-chain helpers.
 * Config lives in this device's localStorage (there is no server to hold it);
 * build-time defaults come from VITE_SG16_AI_* env vars.
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

/** Create a provider instance from a preset, with optional overrides (Admin panel). */
export function createProviderFromPreset(
  presetId: string,
  overrides: Partial<AiProviderConfig> = {},
): AiProviderConfig | null {
  const preset = getPreset(presetId);
  if (!preset) return null;
  return {
    id: overrides.id ?? uid(),
    presetId: preset.id,
    name: overrides.name?.trim() || preset.name,
    adapter: preset.adapter,
    baseUrl: overrides.baseUrl ?? preset.baseUrl,
    apiKey: overrides.apiKey ?? '',
    models: {
      chat: overrides.models?.chat ?? preset.defaultModels.chat,
      coding: overrides.models?.coding ?? preset.defaultModels.coding,
      vision: overrides.models?.vision ?? preset.defaultModels.vision,
      audio: overrides.models?.audio ?? preset.defaultModels.audio,
      image: overrides.models?.image ?? preset.defaultModels.image,
      fallbacks: overrides.models?.fallbacks ?? [...preset.defaultModels.fallbacks],
    },
    enabled: overrides.enabled ?? true,
    priority: overrides.priority ?? 0,
    requiresKey: preset.requiresKey,
    headers: overrides.headers ?? preset.headers,
  };
}

/** A provider is usable when it is enabled, has a base URL and (when required) a key and a chat model. */
export function isProviderUsable(provider: AiProviderConfig): boolean {
  if (!provider.enabled) return false;
  if (!provider.baseUrl.trim()) return false;
  if (provider.requiresKey && !provider.apiKey.trim()) return false;
  return Boolean(provider.models.chat.trim());
}

/** Enabled providers, primary first. This is the fallback chain order. */
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

/** Resolve which model slot serves an intent for a provider. */
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
  if (typeof p.id !== 'string' || typeof p.presetId !== 'string') return null;
  const models = (p.models ?? {}) as Record<string, unknown>;
  const fallbacks = Array.isArray(models.fallbacks) ? models.fallbacks.filter((m): m is string => typeof m === 'string') : [];
  const headers =
    p.headers && typeof p.headers === 'object'
      ? Object.fromEntries(Object.entries(p.headers as Record<string, unknown>).filter(([, v]) => typeof v === 'string')) as Record<string, string>
      : undefined;
  return {
    id: p.id,
    presetId: p.presetId,
    name: typeof p.name === 'string' && p.name.trim() ? p.name : 'Custom provider',
    adapter: p.adapter === 'anthropic' || p.adapter === 'gemini' ? p.adapter : 'openai',
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

/** First-run config from build-time env vars (VITE_SG16_AI_*). */
export function envConfig(): AiConfig {
  const config = defaultConfig();
  const env = import.meta.env;
  const presetId = (env.VITE_SG16_AI_PROVIDER ?? '').trim();
  if (!presetId) return config;
  const provider = createProviderFromPreset(presetId, {
    baseUrl: (env.VITE_SG16_AI_BASE_URL ?? '').trim() || undefined,
    apiKey: (env.VITE_SG16_AI_API_KEY ?? '').trim(),
    models: {
      chat: (env.VITE_SG16_AI_MODEL ?? '').trim() || undefined,
      coding: (env.VITE_SG16_AI_CODING_MODEL ?? '').trim() || undefined,
      vision: (env.VITE_SG16_AI_VISION_MODEL ?? '').trim() || undefined,
      audio: '',
      image: '',
      fallbacks: [],
    } as AiProviderConfig['models'],
    priority: 0,
  });
  if (!provider) return config;
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

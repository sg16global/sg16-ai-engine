import { create } from 'zustand';

import {
  clearConfig,
  defaultConfig,
  exportConfigJson,
  importConfigJson,
  loadConfig,
  saveConfig,
} from '../lib/ai/config';
import type { AiConfig, AiGenerationOptions, AiProviderConfig } from '../lib/ai/types';

/**
 * Live AI configuration (Admin panel state). Every mutation is persisted to
 * localStorage immediately, and every AI call reads this store at call time —
 * so switching providers or models in Admin takes effect everywhere at once,
 * with no reload and no server.
 */

interface AiConfigState {
  hydrated: boolean;
  providers: AiProviderConfig[];
  activeProviderId: string | null;
  options: AiGenerationOptions;

  hydrate: () => void;
  upsertProvider: (provider: AiProviderConfig) => void;
  removeProvider: (id: string) => void;
  setProviderEnabled: (id: string, enabled: boolean) => void;
  setActiveProvider: (id: string) => void;
  /** Move a provider up/down the fallback chain (priority). */
  moveProvider: (id: string, direction: -1 | 1) => void;
  setOptions: (patch: Partial<AiGenerationOptions>) => void;
  resetToDefaults: () => void;
  importConfig: (json: string) => { ok: true } | { ok: false; error: string };
  exportConfig: () => string;
}

function persist(state: Pick<AiConfigState, 'providers' | 'activeProviderId' | 'options'>): AiConfig {
  const config: AiConfig = {
    providers: state.providers,
    activeProviderId: state.activeProviderId,
    options: state.options,
    updatedAt: Date.now(),
  };
  saveConfig(config);
  return config;
}

function normalizePriorities(providers: AiProviderConfig[]): AiProviderConfig[] {
  const sorted = [...providers].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  return providers.map((p) => {
    const index = sorted.findIndex((s) => s.id === p.id);
    return { ...p, priority: index };
  });
}

export const useAiConfigStore = create<AiConfigState>((set, get) => ({
  hydrated: false,
  providers: [],
  activeProviderId: null,
  options: { ...defaultConfig().options },

  hydrate: () => {
    if (get().hydrated) return;
    const config = loadConfig();
    set({
      hydrated: true,
      providers: config.providers,
      activeProviderId: config.activeProviderId,
      options: config.options,
    });
  },

  upsertProvider: (provider) =>
    set((state) => {
      const exists = state.providers.some((p) => p.id === provider.id);
      const providers = exists
        ? state.providers.map((p) => (p.id === provider.id ? provider : p))
        : [...state.providers, { ...provider, priority: provider.priority ?? state.providers.length }];
      const next = { ...state, providers: normalizePriorities(providers) };
      persist(next);
      return next;
    }),

  removeProvider: (id) =>
    set((state) => {
      const providers = state.providers.filter((p) => p.id !== id);
      const activeProviderId =
        state.activeProviderId === id ? (providers.length ? providers[0].id : null) : state.activeProviderId;
      const next = { ...state, providers, activeProviderId };
      persist(next);
      return next;
    }),

  setProviderEnabled: (id, enabled) =>
    set((state) => {
      const providers = state.providers.map((p) => (p.id === id ? { ...p, enabled } : p));
      const next = { ...state, providers };
      persist(next);
      return next;
    }),

  setActiveProvider: (id) =>
    set((state) => {
      const provider = state.providers.find((p) => p.id === id);
      if (!provider) return state;
      // The active provider becomes first in the chain.
      const providers = normalizePriorities([
        { ...provider, priority: -1 },
        ...state.providers.filter((p) => p.id !== id),
      ]);
      const next = { ...state, providers, activeProviderId: id };
      persist(next);
      return next;
    }),

  moveProvider: (id, direction) =>
    set((state) => {
      const providers = [...state.providers].sort((a, b) => a.priority - b.priority);
      const index = providers.findIndex((p) => p.id === id);
      const swap = index + direction;
      if (index < 0 || swap < 0 || swap >= providers.length) return state;
      [providers[index], providers[swap]] = [providers[swap], providers[index]];
      const next = { ...state, providers: normalizePriorities(providers) };
      persist(next);
      return next;
    }),

  setOptions: (patch) =>
    set((state) => {
      const next = { ...state, options: { ...state.options, ...patch } };
      persist(next);
      return next;
    }),

  resetToDefaults: () => {
    clearConfig();
    const fresh = defaultConfig();
    set({ providers: fresh.providers, activeProviderId: fresh.activeProviderId, options: fresh.options });
  },

  importConfig: (json) => {
    try {
      const config = importConfigJson(json);
      saveConfig(config);
      set({
        providers: config.providers,
        activeProviderId: config.activeProviderId,
        options: config.options,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Invalid config file.' };
    }
  },

  exportConfig: () => exportConfigJson(persist(get())),
}));

if (typeof window !== 'undefined') {
  // Hydrate once at startup; the Admin panel and AI calls read from here.
  queueMicrotask(() => useAiConfigStore.getState().hydrate());
}

import { describe, expect, it } from 'vitest';

import {
  activeProvider,
  createProvider,
  defaultConfig,
  exportConfigJson,
  importConfigJson,
  isProviderUsable,
  modelForIntent,
  providerChain,
  sanitizeConfig,
} from './config';
import type { AiConfig, AiProviderConfig } from './types';

function provider(partial: Partial<AiProviderConfig>): AiProviderConfig {
  return {
    id: 'p1',
    name: 'Test',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    models: { chat: 'model-a', coding: '', vision: '', audio: '', image: '', fallbacks: [] },
    enabled: true,
    priority: 0,
    requiresKey: true,
    ...partial,
  };
}

describe('createProvider', () => {
  it('builds a raw provider from user-entered values', () => {
    const p = createProvider({
      name: 'My endpoint',
      baseUrl: 'https://api.example.com/v1/',
      apiKey: 'sk-abc',
      models: { chat: 'my-model', coding: 'my-coder', fallbacks: ['my-model', ' other '] },
    });
    expect(p.id).toBeTruthy();
    expect(p.name).toBe('My endpoint');
    expect(p.baseUrl).toBe('https://api.example.com/v1'); // trailing slash stripped
    expect(p.apiKey).toBe('sk-abc');
    expect(p.models.chat).toBe('my-model');
    expect(p.models.coding).toBe('my-coder');
    expect(p.models.vision).toBe('');
    expect(p.models.fallbacks).toEqual(['my-model', 'other']); // trimmed, empties dropped
    expect(p.requiresKey).toBe(true);
    expect(p.enabled).toBe(true);
  });

  it('falls back to a default name and empty key', () => {
    const p = createProvider({ name: '  ', baseUrl: 'https://x.example.com', models: { chat: 'm' } });
    expect(p.name).toBe('Custom endpoint');
    expect(p.apiKey).toBe('');
  });

  it('keeps an existing id when editing', () => {
    const p = createProvider({ id: 'keep-me', name: 'X', baseUrl: 'https://x.example.com', models: { chat: 'm' } });
    expect(p.id).toBe('keep-me');
  });

  it('honours requiresKey=false for keyless endpoints', () => {
    const p = createProvider({ name: 'Local', baseUrl: 'http://localhost:11434/v1', requiresKey: false, models: { chat: 'm' } });
    expect(p.requiresKey).toBe(false);
  });
});

describe('isProviderUsable', () => {
  it('requires enabled, base URL, key (when required) and a chat model', () => {
    expect(isProviderUsable(provider({}))).toBe(true);
    expect(isProviderUsable(provider({ enabled: false }))).toBe(false);
    expect(isProviderUsable(provider({ baseUrl: '' }))).toBe(false);
    expect(isProviderUsable(provider({ apiKey: '' }))).toBe(false);
    expect(isProviderUsable(provider({ requiresKey: false, apiKey: '' }))).toBe(true);
    expect(isProviderUsable(provider({ models: { chat: '', coding: '', vision: '', audio: '', image: '', fallbacks: [] } }))).toBe(false);
  });
});

describe('providerChain + activeProvider', () => {
  it('returns enabled providers ordered by priority', () => {
    const providers = [
      provider({ id: 'a', name: 'A', priority: 2 }),
      provider({ id: 'b', name: 'B', priority: 0, enabled: false }),
      provider({ id: 'c', name: 'C', priority: 1 }),
    ];
    const chain = providerChain(providers);
    // b is disabled; the rest follow priority order (c=1 before a=2).
    expect(chain.map((p) => p.id)).toEqual(['c', 'a']);
  });

  it('activeProvider picks the active id, else the first of the chain', () => {
    const providers = [provider({ id: 'a', priority: 0 }), provider({ id: 'b', priority: 1 })];
    expect(activeProvider(providers, 'b')!.id).toBe('b');
    expect(activeProvider(providers, null)!.id).toBe('a');
    expect(activeProvider(providers, 'missing')!.id).toBe('a');
    expect(activeProvider([], null)).toBeNull();
  });
});

describe('modelForIntent', () => {
  const p = provider({
    models: { chat: 'chat-model', coding: 'code-model', vision: 'vision-model', audio: '', image: '', fallbacks: [] },
  });

  it('resolves each slot with fallbacks', () => {
    expect(modelForIntent(p, 'chat')).toBe('chat-model');
    expect(modelForIntent(p, 'reasoning')).toBe('chat-model');
    expect(modelForIntent(p, 'code')).toBe('code-model');
    expect(modelForIntent(p, 'vision')).toBe('vision-model');
  });

  it('falls back to chat when a slot is empty', () => {
    const noVision = provider({ models: { chat: 'chat-model', coding: '', vision: '', audio: '', image: '', fallbacks: [] } });
    expect(modelForIntent(noVision, 'vision')).toBe('chat-model');
    expect(modelForIntent(noVision, 'code')).toBe('chat-model');
  });
});

describe('sanitizeConfig', () => {
  it('returns defaults for garbage input', () => {
    expect(sanitizeConfig(null).providers).toEqual([]);
    expect(sanitizeConfig('nope').providers).toEqual([]);
    expect(sanitizeConfig({}).options.liveSearch).toBe(true);
  });

  it('sanitizes providers and normalizes duplicate priorities', () => {
    const raw = {
      providers: [
        { id: 'a', name: 'A', baseUrl: 'https://a.example.com/v1/', priority: 0 },
        { id: 'b', name: '  ', baseUrl: 'https://b.example.com/v1', priority: 0 },
        { not: 'a provider' },
      ],
      activeProviderId: 'a',
      options: { temperature: 0.7, maxTokens: 'lots', liveSearch: false },
    };
    const config = sanitizeConfig(raw);
    expect(config.providers).toHaveLength(2);
    expect(config.providers[0].baseUrl).toBe('https://a.example.com/v1'); // trailing slash stripped
    expect(config.providers[1].name).toBe('Custom endpoint'); // blank name replaced
    expect(config.providers.map((p) => p.priority)).toEqual([0, 1]); // unique, deterministic
    expect(config.options).toEqual({ temperature: 0.7, maxTokens: null, liveSearch: false });
    expect(config.activeProviderId).toBe('a');
  });

  it('drops legacy preset/adapter fields from older configs', () => {
    const raw = {
      providers: [
        { id: 'a', presetId: 'legacy', adapter: 'openai', name: 'Old', baseUrl: 'https://a.example.com', priority: 0 },
      ],
    };
    const config = sanitizeConfig(raw);
    expect(config.providers).toHaveLength(1);
    expect(config.providers[0]).not.toHaveProperty('presetId');
    expect(config.providers[0]).not.toHaveProperty('adapter');
  });

  it('keeps default generation options when none are stored', () => {
    expect(sanitizeConfig({}).options).toEqual(defaultConfig().options);
  });
});

describe('export/import round-trip', () => {
  it('round-trips a config through JSON', () => {
    const config: AiConfig = {
      providers: [provider({ id: 'a', priority: 0 }), provider({ id: 'b', priority: 1 })],
      activeProviderId: 'b',
      options: { temperature: 0.3, maxTokens: 512, liveSearch: true },
      updatedAt: 123,
    };
    const imported = importConfigJson(exportConfigJson(config));
    expect(imported.providers.map((p) => p.id)).toEqual(['a', 'b']);
    expect(imported.activeProviderId).toBe('b');
    expect(imported.options.temperature).toBe(0.3);
    expect(imported.options.maxTokens).toBe(512);
  });

  it('rejects a config without providers', () => {
    expect(() => importConfigJson(JSON.stringify({ providers: [] }))).toThrow('No providers');
    expect(() => importConfigJson('not json')).toThrow();
  });
});

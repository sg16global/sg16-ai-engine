import { describe, expect, it } from 'vitest';

import {
  activeProvider,
  createProviderFromPreset,
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
    presetId: 'custom',
    name: 'Test',
    adapter: 'openai',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    models: { chat: 'model-a', coding: '', vision: '', audio: '', image: '', fallbacks: [] },
    enabled: true,
    priority: 0,
    requiresKey: true,
    ...partial,
  };
}

describe('createProviderFromPreset', () => {
  it('builds a provider with preset defaults', () => {
    const p = createProviderFromPreset('qwen');
    expect(p).not.toBeNull();
    expect(p!.presetId).toBe('qwen');
    expect(p!.baseUrl).toBe('https://dashscope-intl.aliyuncs.com/compatible-mode/v1');
    expect(p!.models.chat).toBe('qwen-plus');
    expect(p!.models.fallbacks.length).toBeGreaterThan(0);
    expect(p!.requiresKey).toBe(true);
    expect(p!.enabled).toBe(true);
    expect(p!.id).toBeTruthy();
  });

  it('applies overrides', () => {
    const p = createProviderFromPreset('openai', {
      name: 'Work OpenAI',
      apiKey: 'sk-abc',
      models: { chat: 'gpt-4o', coding: '', vision: '', audio: '', image: '', fallbacks: [] },
    });
    expect(p!.name).toBe('Work OpenAI');
    expect(p!.apiKey).toBe('sk-abc');
    expect(p!.models.chat).toBe('gpt-4o');
    expect(p!.models.coding).toBe('');
  });

  it('returns null for an unknown preset', () => {
    expect(createProviderFromPreset('nope')).toBeNull();
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
        { id: 'a', presetId: 'openai', name: 'A', adapter: 'weird', baseUrl: 'https://a.example.com/v1/', priority: 0 },
        { id: 'b', presetId: 'qwen', name: '  ', baseUrl: 'https://b.example.com/v1', priority: 0 },
        { not: 'a provider' },
      ],
      activeProviderId: 'a',
      options: { temperature: 0.7, maxTokens: 'lots', liveSearch: false },
    };
    const config = sanitizeConfig(raw);
    expect(config.providers).toHaveLength(2);
    expect(config.providers[0].adapter).toBe('openai'); // unknown adapter falls back
    expect(config.providers[0].baseUrl).toBe('https://a.example.com/v1'); // trailing slash stripped
    expect(config.providers[1].name).toBe('Custom provider'); // blank name replaced
    expect(config.providers.map((p) => p.priority)).toEqual([0, 1]); // unique, deterministic
    expect(config.options).toEqual({ temperature: 0.7, maxTokens: null, liveSearch: false });
    expect(config.activeProviderId).toBe('a');
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

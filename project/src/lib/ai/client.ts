import { useAiConfigStore } from '../../core/aiConfigStore';
import { setEngineStatus } from '../apiStatus';
import { getAdapter } from './adapters';
import { modelForIntent, providerChain } from './config';
import { AiError, type AiIntent, type AiProviderConfig, type ChatCompletionRequest, type ChatCompletionResult } from './types';

/**
 * The one place every AI call goes through.
 *
 * - Picks the active provider, then walks the fallback chain (next providers,
 *   then each provider's model fallbacks) until one answers.
 * - Rate-limited providers/models go into a cooldown and are skipped.
 * - Reports real connectivity to the engine status bar (online/offline).
 * - Works identically for every adapter, so Pilot, Shields, chat, vision,
 *   images and voice never care which AI API is connected.
 */

const COOLDOWN_MS = 5 * 60 * 1000;
const PROVIDER_COOLDOWN_MS = 2 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 90_000;

const cooldowns = new Map<string, number>();

function markCooldown(key: string, ms: number): void {
  cooldowns.set(key, Date.now() + ms);
}

function inCooldown(key: string): boolean {
  const until = cooldowns.get(key);
  if (!until) return false;
  if (Date.now() >= until) {
    cooldowns.delete(key);
    return false;
  }
  return true;
}

function snapshotProviders(): AiProviderConfig[] {
  const state = useAiConfigStore.getState();
  return providerChain(state.providers);
}

/** Model chain for one provider + intent: resolved slot first, then configured fallbacks. */
function modelChainFor(provider: AiProviderConfig, intent: AiIntent, override?: string): string[] {
  if (override?.trim()) return [override.trim()];
  const primary = modelForIntent(provider, intent);
  const fallbacks = intent === 'vision' || intent === 'code' ? [] : provider.models.fallbacks;
  return [...new Set([primary, ...fallbacks].filter(Boolean))];
}

async function callProvider(
  provider: AiProviderConfig,
  request: ChatCompletionRequest,
  model: string,
): Promise<ChatCompletionResult> {
  const adapter = getAdapter(provider.adapter);
  const started = Date.now();
  const content = await adapter.chat({
    provider,
    messages: request.messages,
    model,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    timeoutMs: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    signal: request.signal,
  });
  return {
    content,
    model,
    providerId: provider.id,
    providerName: provider.name,
    latencyMs: Date.now() - started,
  };
}

export async function chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
  const chain = snapshotProviders();

  if (!chain.length) {
    throw new AiError(
      'No AI model is connected yet. Open Admin (in the sidebar) and connect OpenAI, Qwen, DeepSeek, or any other AI API — it takes under a minute.',
      { noProvider: true, code: 'NO_PROVIDER' },
    );
  }

  const ordered = request.providerId
    ? [chain.find((p) => p.id === request.providerId) ?? chain[0], ...chain.filter((p) => p.id !== (request.providerId ?? chain[0].id))]
    : chain;

  const intent: AiIntent = request.intent ?? 'chat';
  let lastError: AiError | null = null;
  let sawOffline = false;

  for (const provider of ordered) {
    if (inCooldown(provider.id)) continue;
    const models = modelChainFor(provider, intent, request.model);

    for (const model of models) {
      const modelKey = `${provider.id}:${model}`;
      if (inCooldown(modelKey)) continue;
      try {
        const result = await callProvider(provider, request, model);
        setEngineStatus('online');
        return result;
      } catch (err) {
        const aiErr =
          err instanceof AiError
            ? err
            : new AiError(err instanceof Error ? err.message : 'AI request failed', { providerId: provider.id });
        lastError = aiErr;
        if (aiErr.offline) sawOffline = true;
        if (aiErr.rateLimited) {
          markCooldown(modelKey, COOLDOWN_MS);
          markCooldown(provider.id, PROVIDER_COOLDOWN_MS);
          continue;
        }
        // Auth/config/format errors: try the next model/provider — a wrong key
        // on one provider must not take down a feature that another can serve.
        continue;
      }
    }
  }

  setEngineStatus(sawOffline && !lastError?.status ? 'offline' : 'online');
  throw (
    lastError ??
    new AiError('All AI providers are busy right now. Please try again in a moment.', { rateLimited: true, code: 'BUSY' })
  );
}

/** List the models a provider exposes (Admin "fetch models"). Empty array when unsupported. */
export async function listProviderModels(provider: AiProviderConfig): Promise<string[]> {
  try {
    return await getAdapter(provider.adapter).listModels(provider);
  } catch {
    return [];
  }
}

export interface ProviderTestResult {
  ok: boolean;
  latencyMs: number;
  model: string | null;
  sample: string;
  error: string | null;
}

/**
 * Tiny probe used by the Admin panel "Test connection" button.
 * Tests exactly this provider + model — no fallback chain, and it works for
 * providers that are not saved yet (the Admin form tests before saving).
 */
export async function testProvider(provider: AiProviderConfig): Promise<ProviderTestResult> {
  const started = Date.now();
  const model = provider.models.chat || provider.models.coding || provider.models.fallbacks[0] || '';
  try {
    const content = await getAdapter(provider.adapter).chat({
      provider,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      model,
      temperature: 0,
      maxTokens: 8,
      timeoutMs: 30_000,
    });
    setEngineStatus('online');
    return {
      ok: true,
      latencyMs: Date.now() - started,
      model,
      sample: content.slice(0, 80),
      error: null,
    };
  } catch (err) {
    const aiErr =
      err instanceof AiError
        ? err
        : new AiError(err instanceof Error ? err.message : 'Connection failed.', { providerId: provider.id, offline: true });
    if (aiErr.offline && !aiErr.status) setEngineStatus('offline');
    return {
      ok: false,
      latencyMs: Date.now() - started,
      model: model || null,
      sample: '',
      error: aiErr.message,
    };
  }
}

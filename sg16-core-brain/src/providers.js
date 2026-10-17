/**
 * Model providers for the SG16 Core Brain.
 *
 * Core: Mistral 7B on Cloudflare Workers AI (env.AI binding) — always tried first.
 * Add-ons: any OpenAI-compatible API listed in the EXTRA_PROVIDERS secret, used only
 * when the core cannot answer (quota reached, model error).
 */

export const DEFAULT_CORE_MODEL = '@cf/mistral/mistral-7b-instruct-v0.2-lora';
export const DEFAULT_VISION_MODEL = '@cf/llava-hf/llava-1.5-7b-hf';

export function coreModels(env) {
  const primary = (env.CORE_MODEL || DEFAULT_CORE_MODEL).trim();
  const fallbacks = (env.CORE_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

export async function runCoreModel(env, model, messages, { maxTokens, temperature }) {
  if (!env.AI) throw new Error('Workers AI binding "AI" is missing');
  const out = await env.AI.run(model, { messages, max_tokens: maxTokens, temperature });
  const text = typeof out?.response === 'string' ? out.response.trim() : '';
  if (!text) throw new Error(`${model} returned an empty response`);
  return text;
}

/**
 * EXTRA_PROVIDERS secret, JSON array:
 * [{ "name": "openrouter", "url": "https://openrouter.ai/api/v1", "key": "sk-...", "model": "mistralai/mistral-7b-instruct" }]
 */
export function extraProviders(env) {
  if (!env.EXTRA_PROVIDERS) return [];
  try {
    const list = JSON.parse(env.EXTRA_PROVIDERS);
    return (Array.isArray(list) ? list : []).filter((p) => p && p.url && p.model);
  } catch {
    console.warn('[sg16-core] EXTRA_PROVIDERS is not valid JSON — add-on APIs disabled');
    return [];
  }
}

function chatCompletionsUrl(url) {
  const base = url.replace(/\/+$/, '');
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

export async function runOpenAICompatible(provider, messages, { maxTokens, temperature, timeoutMs = 60_000 }) {
  const headers = { 'Content-Type': 'application/json' };
  if (provider.key) headers.Authorization = `Bearer ${provider.key}`;
  const res = await fetch(chatCompletionsUrl(provider.url), {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: provider.model, messages, max_tokens: maxTokens, temperature }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `${provider.name || provider.url} returned ${res.status}`);
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${provider.name || provider.url} returned an empty response`);
  return text;
}

export async function runVision(env, prompt, imageBytes) {
  if (!env.AI) throw new Error('Workers AI binding "AI" is missing');
  const model = (env.VISION_MODEL || DEFAULT_VISION_MODEL).trim();
  const out = await env.AI.run(model, { image: [...imageBytes], prompt, max_tokens: 512 });
  const text = (out?.description ?? out?.response ?? '').trim();
  if (!text) throw new Error(`${model} returned an empty description`);
  return { text, model };
}

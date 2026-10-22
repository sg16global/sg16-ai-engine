import {
  callMistralBrainChat,
  callMistralBrainVision,
  isMistralBrainCloud,
  isMistralBrainConfigured,
  probeMistralBrain,
} from './mistralBrainClient.js';

// After "too many requests" a model rests 60 s and its provider 30 s, so the next provider answers
// meanwhile. (Was 5 min / 2 min — with one provider that blocked every user for minutes.)
const COOLDOWN_MS = Number(process.env.SG16_RATE_COOLDOWN_MS || 60 * 1000);
const PROVIDER_COOLDOWN_MS = Number(process.env.SG16_PROVIDER_COOLDOWN_MS || 30 * 1000);

const cooldowns = new Map();

export function isRateLimitError(message = '', status = 0) {
  const m = String(message).toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    m.includes('rate limit') ||
    m.includes('rate_limit') ||
    m.includes('quota') ||
    m.includes('tokens per') ||
    m.includes('too many requests') ||
    m.includes('capacity') ||
    m.includes('overloaded')
  );
}

export function markProviderCooldown(provider, ms = COOLDOWN_MS) {
  cooldowns.set(provider, Date.now() + ms);
}

export function isProviderInCooldown(provider) {
  const until = cooldowns.get(provider) || 0;
  return Date.now() < until;
}

function cleanKey(key) {
  const k = key?.trim();
  if (!k || k.startsWith('<your_')) return null;
  return k;
}

function getSpeedMode() {
  const flag = process.env.SG16_SPEED_MODE?.trim().toLowerCase();
  if (flag === 'quality' || flag === '0' || flag === 'false') return 'quality';
  return 'speed';
}

export function isSovereignBrain() {
  const mode = process.env.SG16_BRAIN?.trim().toLowerCase();
  return mode === 'ollama';
}

export function isCloudMistralBrain() {
  return isMistralBrainCloud() && isMistralBrainConfigured();
}

function getOllamaBaseUrl() {
  return (process.env.OLLAMA_URL || process.env.SG16_OLLAMA_URL || 'http://127.0.0.1:11434').replace(
    /\/$/,
    '',
  );
}

function getOllamaModel() {
  return (
    process.env.SG16_OLLAMA_MODEL ||
    process.env.SG16_AI_MODEL_TEXT ||
    'mistral:7b-instruct'
  ).trim();
}

async function callOllamaNativeChat({ messages, model, temperature, maxTokens, timeoutMs }) {
  const ollamaModel = model || getOllamaModel();
  const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages,
      stream: false,
      options: {
        num_ctx: Number(process.env.OLLAMA_NUM_CTX || 2048),
        num_predict: maxTokens,
        num_thread: Number(process.env.OLLAMA_NUM_THREAD || 4),
        temperature,
      },
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '24h',
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const err = new Error('SG16 AI request failed');
    err.status = res.status;
    err.provider = 'ollama';
    throw err;
  }
  if (!res.ok) {
    const err = new Error(data.error || 'SG16 AI request failed');
    err.status = res.status;
    err.provider = 'ollama';
    throw err;
  }

  const content = data.message?.content?.trim();
  if (!content) throw new Error('SG16 AI returned an empty response');
  return content;
}

/** Quick chat probe for /health/deep */
export async function probeOllamaChat() {
  const started = Date.now();
  try {
    const reply = await callOllamaNativeChat({
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      temperature: 0,
      maxTokens: 8,
      timeoutMs: Number(process.env.SG16_OLLAMA_PROBE_MS || 60000),
    });
    return {
      ok: true,
      latencyMs: Date.now() - started,
      model: getOllamaModel(),
      sample: reply.slice(0, 40),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      model: getOllamaModel(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function getMistralBrainProvider() {
  if (!isMistralBrainConfigured()) return null;
  return {
    id: 'mistralbrain',
    apiUrl: `${(process.env.MISTRAL_BRAIN_URL || 'https://api.mistralbrain.com').replace(/\/$/, '')}/api/v1/control`,
    apiKey: process.env.MISTRAL_BRAIN_KEY || process.env.DOOR_API_KEY || process.env.SG16_MISTRAL_BRAIN_KEY,
    models: {
      text: 'SG16 Mistral X',
      reasoning: 'SG16 Mistral X',
      coding: 'SG16 Mistral X',
      vision: null,
    },
  };
}

function getOllamaProvider() {
  if (!isSovereignBrain() && !process.env.OLLAMA_URL && !process.env.SG16_OLLAMA_URL) {
    return null;
  }
  if (!isSovereignBrain()) return null;

  const model = getOllamaModel();
  return {
    id: 'ollama',
    apiUrl: `${getOllamaBaseUrl()}/v1/chat/completions`,
    apiKey: 'ollama',
    models: {
      text: model,
      reasoning: model,
      coding: model,
      vision: null,
    },
  };
}

function getGroqProvider() {
  const groqKey =
    cleanKey(process.env.SG16_AI_API_KEY) || cleanKey(process.env.SG16_ROUTER_API_KEY);
  if (!groqKey) return null;

  if (process.env.SG16_AI_API_URL && cleanKey(process.env.SG16_AI_API_KEY)) {
    const url = process.env.SG16_AI_API_URL.trim();
    if (!url.includes('groq.com')) return null;
  }

  return {
    id: 'groq',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: groqKey,
    models: getGroqStyleModels(),
  };
}

function getXaiProvider() {
  const key = cleanKey(process.env.XAI_API_KEY);
  if (!key) return null;
  return {
    id: 'xai',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    apiKey: key,
    models: {
      text: process.env.SG16_AI_MODEL_TEXT || 'grok-2-latest',
      reasoning: process.env.SG16_AI_MODEL_REASONING || 'grok-2-latest',
      coding: process.env.SG16_AI_MODEL_CODING || process.env.SG16_AI_MODEL_REASONING || 'grok-2-latest',
      vision: process.env.SG16_AI_MODEL_VISION || 'grok-2-vision-latest',
    },
  };
}

function getCustomProvider() {
  if (!process.env.SG16_AI_API_URL || !cleanKey(process.env.SG16_AI_API_KEY)) return null;
  const url = process.env.SG16_AI_API_URL.trim();
  if (url.includes('groq.com')) return null;
  return {
    id: 'custom',
    apiUrl: url,
    apiKey: cleanKey(process.env.SG16_AI_API_KEY),
    models: getGroqStyleModels(),
  };
}

const MAX_API_SLOTS = 5;

/** Slot 1 reads AI_API_URL, AI_MODEL, …; slot n reads AI_API_URL_n, AI_MODEL_n, … */
function apiEnv(name, slot) {
  return process.env[slot === 1 ? name : `${name}_${slot}`]?.trim() || '';
}

function parseHeaders(raw) {
  if (!raw) return {};
  try {
    const headers = JSON.parse(raw);
    return headers && typeof headers === 'object' && !Array.isArray(headers) ? headers : {};
  } catch {
    console.warn('SG16: AI_API_HEADERS is not valid JSON — ignored');
    return {};
  }
}

/**
 * One AI API connection. Any company with an OpenAI-compatible API works:
 *   AI_API_URL       base URL (e.g. https://api.openai.com/v1, https://your-ollama/v1),
 *                    or an SG16 Brain endpoint ending in /api/brain
 *   AI_API_KEY       optional — sent as Bearer
 *   AI_MODEL         chat model — chat, maths and every shield except coding
 *   AI_CODING_MODEL  optional coding model (Coding Hub); defaults to AI_MODEL
 *   AI_VISION_MODEL  optional — image questions and student ID checks
 *   AI_API_HEADERS   optional JSON of extra headers (e.g. Cloudflare Access service-token headers)
 * Slots 2–5 (AI_API_URL_2 … AI_API_URL_5, same names with _n) are automatic fallbacks, tried in order.
 */
function getApiSlotProvider(slot) {
  const url = apiEnv('AI_API_URL', slot);
  if (!url) return null;
  const base = url.replace(/\/+$/, '');
  const format = /\/api\/brain$/.test(base) ? 'sg16-brain' : 'openai';
  const model = apiEnv('AI_MODEL', slot) || (format === 'sg16-brain' ? 'sg16-brain' : 'gpt-4o-mini');
  return {
    id: slot === 1 ? 'api' : `api${slot}`,
    kind: 'api',
    format,
    apiUrl: format === 'sg16-brain' || base.endsWith('/chat/completions') ? base : `${base}/chat/completions`,
    apiKey: cleanKey(apiEnv('AI_API_KEY', slot)) || '',
    headers: parseHeaders(apiEnv('AI_API_HEADERS', slot)),
    models: {
      text: model,
      reasoning: model,
      coding: apiEnv('AI_CODING_MODEL', slot) || model,
      vision: apiEnv('AI_VISION_MODEL', slot) || null,
    },
  };
}

/** The first configured AI API connection (slot 1, or the lowest slot that is set). */
export function getApiProvider() {
  return getApiProviders()[0] || null;
}

/** Every configured AI API connection, in fallback order. */
export function getApiProviders() {
  const providers = [];
  for (let slot = 1; slot <= MAX_API_SLOTS; slot++) {
    const provider = getApiSlotProvider(slot);
    if (provider) providers.push(provider);
  }
  return providers;
}

export function isApiProvider(provider) {
  return provider?.kind === 'api';
}

export function getPrimaryProvider() {
  const api = getApiProvider();
  if (api) return api;

  const mistralBrain = getMistralBrainProvider();
  if (mistralBrain) return mistralBrain;

  const ollama = getOllamaProvider();
  if (ollama) return ollama;

  const groq = getGroqProvider();
  const xai = getXaiProvider();
  const custom = getCustomProvider();

  if (getSpeedMode() === 'speed') {
    if (groq) return groq;
    if (xai) return xai;
    if (custom) return custom;
    return null;
  }

  if (xai) return xai;
  if (groq) return groq;
  if (custom) return custom;
  return null;
}

export function getBackupProvider() {
  const backupKey =
    cleanKey(process.env.SG16_OPENROUTER_API_KEY) ||
    cleanKey(process.env.SG16_BACKUP_API_KEY) ||
    cleanKey(process.env.SG16_AI_API_KEY_BACKUP);
  if (!backupKey) return null;

  const apiUrl =
    process.env.SG16_BACKUP_API_URL?.trim() ||
    process.env.SG16_OPENROUTER_API_URL?.trim() ||
    'https://openrouter.ai/api/v1/chat/completions';

  const isOpenRouter = apiUrl.includes('openrouter.ai');
  const defaultText = isOpenRouter
    ? 'meta-llama/llama-3.3-70b-instruct'
    : 'llama-3.3-70b-versatile';

  const textModel = process.env.SG16_BACKUP_MODEL_TEXT || defaultText;
  const reasoningModel =
    process.env.SG16_BACKUP_MODEL_REASONING || textModel;

  const extraFallbacks = (process.env.SG16_BACKUP_MODEL_FALLBACKS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    id: isOpenRouter ? 'openrouter' : 'backup',
    apiUrl,
    apiKey: backupKey,
    siteUrl: process.env.SG16_APP_URL || 'https://saiftechglobal.com',
    appName: process.env.SG16_APP_NAME || 'SG16 AI Engine',
    models: {
      text: textModel,
      reasoning: reasoningModel,
      vision: process.env.SG16_BACKUP_MODEL_VISION || null,
      fallbacks: extraFallbacks,
    },
  };
}

function getGroqStyleModels() {
  return {
    text: process.env.SG16_AI_MODEL_TEXT || 'llama-3.1-8b-instant',
    reasoning: process.env.SG16_AI_MODEL_REASONING || 'llama-3.3-70b-versatile',
    coding: process.env.SG16_AI_MODEL_CODING || 'llama-3.3-70b-versatile',
    vision: process.env.SG16_AI_MODEL_VISION || 'meta-llama/llama-4-scout-17b-16e-instruct',
  };
}

/** @deprecated use getPrimaryProvider */
export function getApiKey() {
  return getPrimaryProvider()?.apiKey || getBackupProvider()?.apiKey || null;
}

/** @deprecated use getPrimaryProvider */
export function getApiUrl() {
  return getPrimaryProvider()?.apiUrl || getBackupProvider()?.apiUrl || null;
}

export function getGroqApiUrl() {
  const primary = getPrimaryProvider();
  if (primary?.id === 'groq') return primary.apiUrl;
  if (primary?.id === 'custom' && primary.apiUrl.includes('groq.com')) return primary.apiUrl;
  if (!cleanKey(process.env.XAI_API_KEY)) {
    return 'https://api.groq.com/openai/v1/chat/completions';
  }
  return null;
}

export function getTextModelChain(provider = getPrimaryProvider()) {
  if (!provider) {
    return (process.env.SG16_BACKUP_MODEL_TEXT || 'meta-llama/llama-3.3-70b-instruct')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
  }

  if (provider.id === 'openrouter' || provider.id === 'backup') {
    return [...new Set([
      provider.models.text,
      provider.models.reasoning,
      ...(provider.models.fallbacks || []),
    ].filter(Boolean))];
  }

  if (provider.id === 'ollama' || isApiProvider(provider)) {
    return [provider.models.text].filter(Boolean);
  }

  if (provider.id === 'mistralbrain') {
    return [provider.models.text].filter(Boolean);
  }

  const primary = provider.models.text;
  const fallbacks = (process.env.SG16_AI_MODEL_FALLBACKS || 'llama-3.1-8b-instant,gemma2-9b-it')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return [...new Set([primary, provider.models.reasoning, ...fallbacks].filter(Boolean))];
}

export function getVisionModelChain(provider = getPrimaryProvider()) {
  if (!provider) return [];
  if (isApiProvider(provider)) {
    return provider.format === 'openai' && provider.models.vision ? [provider.models.vision] : [];
  }

  const visionModels = [];
  if (provider.models?.vision) visionModels.push(provider.models.vision);

  if (provider.id === 'groq' || provider.id === 'custom') {
    visionModels.push(
      ...(process.env.SG16_AI_MODEL_VISION_FALLBACKS || 'llama-3.2-11b-vision-preview')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    );
  }

  if (provider.id === 'openrouter' || provider.id === 'backup') {
    const backupVision =
      process.env.SG16_BACKUP_MODEL_VISION ||
      'meta-llama/llama-3.2-11b-vision-instruct:free';
    visionModels.push(backupVision);
  }

  if (provider.id === 'mistralbrain') {
    return ['SG16 Mistral X Vision'];
  }

  return [...new Set(visionModels.filter(Boolean))];
}

function appendApiProviders(chain) {
  const groq = getGroqProvider();
  const xai = getXaiProvider();
  const custom = getCustomProvider();
  const backup = getBackupProvider();

  if (getSpeedMode() === 'speed') {
    if (groq) chain.push(groq);
    if (xai) chain.push(xai);
  } else {
    if (xai) chain.push(xai);
    if (groq) chain.push(groq);
  }

  if (custom && !chain.some((p) => p.id === custom.id)) chain.push(custom);
  if (backup && !chain.some((p) => p.id === backup.id)) chain.push(backup);
  return chain;
}

export function getChildrenWorldProviderChain() {
  const apis = getApiProviders();
  if (apis.length) return apis;
  const mistralBrain = getMistralBrainProvider();
  if (mistralBrain) return [mistralBrain];
  const ollama = getOllamaProvider();
  if (ollama) return [ollama];
  return [];
}

export function getProviderChain() {
  const apis = getApiProviders();
  if (apis.length) {
    const backup = getBackupProvider();
    return backup ? [...apis, backup] : apis;
  }

  const chain = [];
  const mistralBrain = getMistralBrainProvider();
  if (mistralBrain) {
    chain.push(mistralBrain);
    return chain;
  }

  const ollama = getOllamaProvider();
  if (ollama) chain.push(ollama);
  if (isSovereignBrain() && process.env.SG16_SOVEREIGN_FALLBACK?.trim() !== '1') {
    return chain;
  }
  return appendApiProviders(chain);
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((p) => p?.type === 'text').map((p) => p.text).join('\n');
  return '';
}

const SG16_BRAIN_HISTORY_TURNS = 12;

/**
 * SG16 Brain format (POST /api/brain): { message, history, stream } → { assistantMessage: { content } }.
 * The brain ignores system roles in history, so system instructions travel inside the message.
 */
async function callSg16Brain({ provider, messages, timeoutMs }) {
  const system = messages.filter((m) => m.role === 'system').map((m) => textOf(m.content)).join('\n\n').trim();
  const turns = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: textOf(m.content) }))
    .filter((m) => m.content);
  const last = turns.pop();
  if (!last || last.role !== 'user') throw new Error('SG16 Brain needs a user message');

  const message = system
    ? `[Instructions for this conversation]\n${system}\n\n[User message]\n${last.content}`
    : last.content;
  const headers = { 'Content-Type': 'application/json', ...(provider.headers || {}) };
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;

  const res = await fetch(provider.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, history: turns.slice(-SG16_BRAIN_HISTORY_TURNS), stream: false }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.code || `SG16 Brain returned ${res.status}`);
    err.status = res.status;
    err.provider = 'api';
    throw err;
  }
  const content = textOf(data.assistantMessage?.content).trim();
  if (!content) throw new Error('SG16 Brain returned an empty response');
  return content;
}

/** Quick chat probe for /health/deep when AI_API_URL is set. */
export async function probeApiChat() {
  const api = getApiProvider();
  const started = Date.now();
  try {
    const reply = await callChatCompletion({
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      model: api.models.text,
      temperature: 0,
      maxTokens: 8,
      timeoutMs: 60000,
      provider: api,
    });
    return { ok: true, latencyMs: Date.now() - started, model: api.models.text, sample: reply.slice(0, 40) };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      model: api?.models.text,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function callChatCompletion({
  messages,
  model,
  temperature = 0.7,
  maxTokens = 2048,
  timeoutMs = 90000,
  provider = null,
}) {
  const activeProvider = provider || getPrimaryProvider();
  if (!activeProvider?.apiUrl || (!activeProvider.apiKey && !isApiProvider(activeProvider))) {
    throw new Error('SG16 AI is not configured');
  }

  if (isApiProvider(activeProvider) && activeProvider.format === 'sg16-brain') {
    // A self-hosted brain can take ~45 s to wake its model; allow time for a full answer.
    return callSg16Brain({ provider: activeProvider, messages, timeoutMs: Math.max(timeoutMs, 180000) });
  }

  if (activeProvider.id === 'ollama') {
    maxTokens = Math.min(maxTokens, Number(process.env.SG16_OLLAMA_MAX_TOKENS || 384));
    timeoutMs = Math.max(timeoutMs, Number(process.env.SG16_OLLAMA_TIMEOUT_MS || 180000));
    return callOllamaNativeChat({ messages, model, temperature, maxTokens, timeoutMs });
  }

  if (activeProvider.id === 'mistralbrain') {
    return callMistralBrainChat({
      messages,
      userId: process.env.SG16_BRAIN_USER_ID || 'sg16-ai-engine',
      timeoutMs: Math.max(timeoutMs, Number(process.env.MISTRAL_BRAIN_TIMEOUT_MS || 120000)),
    });
  }

  const headers = { 'Content-Type': 'application/json', ...(activeProvider.headers || {}) };
  if (activeProvider.apiKey) headers.Authorization = `Bearer ${activeProvider.apiKey}`;
  if (activeProvider.id === 'groq') {
    headers['Groq-Model-Version'] = 'latest';
  }
  if (activeProvider.id === 'openrouter' || activeProvider.apiUrl?.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = activeProvider.siteUrl || 'https://saiftechglobal.com';
    headers['X-Title'] = activeProvider.appName || 'SG16 AI Engine';
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const res = await fetch(activeProvider.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const err = new Error('SG16 AI request failed');
    err.status = res.status;
    err.provider = activeProvider.id;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(data.error?.message || 'SG16 AI request failed');
    err.status = res.status;
    err.provider = activeProvider.id;
    throw err;
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('SG16 AI returned an empty response');
  return content;
}

/**
 * Tries each provider in order (AI API slots 1–5, then any legacy backup) until one answers.
 * `modelsFor(provider)` picks that provider's own model names — a backup company's API does not
 * know the first provider's model names. Without it, `models` applies to the first provider only.
 */
export async function callWithModelFallback({
  messages,
  models,
  modelsFor = null,
  temperature = 0.7,
  maxTokens = 2048,
  timeoutMs = 90000,
  providers: providersOverride = null,
}) {
  const providers = providersOverride || getProviderChain();
  if (!providers.length) {
    throw new Error('SG16 AI is not configured');
  }

  let lastError = null;

  const modelChainFor = (provider) => {
    if (modelsFor) return modelsFor(provider);
    if (models && provider === providers[0]) return models;
    return getTextModelChain(provider);
  };

  for (const provider of providers) {
    if (isProviderInCooldown(provider.id)) continue;

    for (const model of modelChainFor(provider)) {
      const modelKey = `${provider.id}:${model}`;
      if (isProviderInCooldown(modelKey)) continue;

      try {
        const content = await callChatCompletion({
          messages,
          model,
          temperature,
          maxTokens,
          timeoutMs,
          provider,
        });
        return { content, model, provider: provider.id };
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err.message, err.status)) {
          markProviderCooldown(modelKey);
          markProviderCooldown(provider.id, PROVIDER_COOLDOWN_MS);
          console.warn(`SG16 ${provider.id}/${model} limited — trying next`);
          continue;
        }
        if (
          isApiProvider(provider) ||
          provider.id === 'ollama' ||
          provider.id === 'groq' ||
          provider.id === 'custom' ||
          provider.id === 'xai' ||
          provider.id === 'openrouter' ||
          provider.id === 'backup'
        ) {
          console.warn(`SG16 ${provider.id} error on ${model}:`, err.message);
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error('SG16 AI capacity reached. Please try again shortly.');
}

export async function callWithVisionFallback({
  messages,
  temperature = 0.1,
  maxTokens = 2048,
}) {
  if (!getApiProvider() && isMistralBrainConfigured()) {
    const content = await callMistralBrainVision({
      messages,
      timeoutMs: Number(process.env.MISTRAL_BRAIN_VISION_TIMEOUT_MS || 120000),
    });
    return { content, model: 'SG16 Mistral X Vision', provider: 'mistralbrain' };
  }

  const providers = getProviderChain();
  if (!providers.length) {
    throw new Error('SG16 AI is not configured');
  }

  let lastError = null;

  for (const provider of providers) {
    if (isProviderInCooldown(provider.id)) continue;

    const modelChain = getVisionModelChain(provider);
    if (!modelChain.length) continue;

    for (const model of modelChain) {
      const modelKey = `${provider.id}:vision:${model}`;
      if (isProviderInCooldown(modelKey)) continue;

      try {
        const content = await callChatCompletion({
          messages,
          model,
          temperature,
          maxTokens,
          provider,
        });
        return { content, model, provider: provider.id };
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err.message, err.status)) {
          markProviderCooldown(modelKey);
          markProviderCooldown(provider.id, 2 * 60 * 1000);
          continue;
        }
        console.warn(`SG16 vision ${provider.id}/${model}:`, err.message);
        continue;
      }
    }
  }

  throw lastError || new Error('SG16 AI vision is temporarily unavailable. Please try again.');
}

export { probeMistralBrain, isMistralBrainConfigured };

export function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function getProviderStatus() {
  const primary = getPrimaryProvider();
  const backup = getBackupProvider();
  const api = getApiProvider();
  return {
    brain: api ? 'api' : isCloudMistralBrain() ? 'mistralbrain-cloud' : isSovereignBrain() ? 'sovereign' : 'api',
    primary: primary ? primary.id : null,
    apiUrl: api ? api.apiUrl.replace(/\/chat\/completions$/, '') : null,
    backup: isSovereignBrain() || isCloudMistralBrain() ? null : backup ? backup.id : null,
    mistralBrainUrl: isCloudMistralBrain() ? (process.env.MISTRAL_BRAIN_URL || 'https://api.mistralbrain.com') : null,
    ollamaUrl: isSovereignBrain() ? getOllamaBaseUrl() : null,
    speedMode: getSpeedMode(),
    chatModel: primary?.models?.text || null,
    codingModel: primary?.models?.coding || primary?.models?.reasoning || null,
    backupModel: backup?.models?.text || null,
    backupVision: backup?.models?.vision || process.env.SG16_BACKUP_MODEL_VISION || null,
    openRouter: backup?.id === 'openrouter',
  };
}

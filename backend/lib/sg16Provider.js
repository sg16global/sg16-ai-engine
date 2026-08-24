const COOLDOWN_MS = Number(process.env.SG16_RATE_COOLDOWN_MS || 5 * 60 * 1000);

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
  return process.env.SG16_BRAIN?.trim().toLowerCase() === 'ollama';
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

export function getPrimaryProvider() {
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
    siteUrl: process.env.SG16_APP_URL || 'https://saiftech.global',
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

  if (provider.id === 'ollama') {
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
  const chain = [];
  const ollama = getOllamaProvider();
  if (ollama) chain.push(ollama);
  return chain;
}

export function getProviderChain() {
  const chain = [];
  const ollama = getOllamaProvider();
  if (ollama) chain.push(ollama);
  if (isSovereignBrain() && process.env.SG16_SOVEREIGN_FALLBACK?.trim() !== '1') {
    return chain;
  }
  return appendApiProviders(chain);
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
  if (!activeProvider?.apiUrl || !activeProvider?.apiKey) {
    throw new Error('SG16 AI is not configured');
  }

  const headers = {
    Authorization: `Bearer ${activeProvider.apiKey}`,
    'Content-Type': 'application/json',
  };
  if (activeProvider.id === 'groq') {
    headers['Groq-Model-Version'] = 'latest';
  }
  if (activeProvider.id === 'openrouter' || activeProvider.apiUrl?.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = activeProvider.siteUrl || 'https://saiftech.global';
    headers['X-Title'] = activeProvider.appName || 'SG16 AI Engine';
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (activeProvider.id === 'ollama') {
    body.options = {
      num_ctx: Number(process.env.OLLAMA_NUM_CTX || 2048),
      num_predict: maxTokens,
      num_thread: Number(process.env.OLLAMA_NUM_THREAD || 4),
    };
    body.keep_alive = process.env.OLLAMA_KEEP_ALIVE || '24h';
  }

  const res = await fetch(activeProvider.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await res.json();
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

export async function callWithModelFallback({
  messages,
  models,
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

  for (const provider of providers) {
    if (isProviderInCooldown(provider.id)) continue;

    const modelChain = models || getTextModelChain(provider);

    for (const model of modelChain) {
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
          markProviderCooldown(provider.id, 2 * 60 * 1000);
          console.warn(`SG16 ${provider.id}/${model} limited — trying next`);
          continue;
        }
        if (
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
  return {
    brain: isSovereignBrain() ? 'sovereign' : 'api',
    primary: primary ? primary.id : null,
    backup: isSovereignBrain() ? null : backup ? backup.id : null,
    ollamaUrl: isSovereignBrain() ? getOllamaBaseUrl() : null,
    speedMode: getSpeedMode(),
    chatModel: primary?.models?.text || null,
    codingModel: primary?.models?.coding || primary?.models?.reasoning || null,
    backupModel: backup?.models?.text || null,
    backupVision: backup?.models?.vision || process.env.SG16_BACKUP_MODEL_VISION || null,
    openRouter: backup?.id === 'openrouter',
  };
}

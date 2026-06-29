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

export function getPrimaryProvider() {
  if (cleanKey(process.env.XAI_API_KEY)) {
    return {
      id: 'xai',
      apiUrl: 'https://api.x.ai/v1/chat/completions',
      apiKey: cleanKey(process.env.XAI_API_KEY),
      models: {
        text: process.env.SG16_AI_MODEL_TEXT || 'grok-2-latest',
        reasoning: process.env.SG16_AI_MODEL_REASONING || 'grok-2-latest',
        vision: process.env.SG16_AI_MODEL_VISION || 'grok-2-vision-latest',
      },
    };
  }

  if (process.env.SG16_AI_API_URL && cleanKey(process.env.SG16_AI_API_KEY)) {
    return {
      id: 'custom',
      apiUrl: process.env.SG16_AI_API_URL,
      apiKey: cleanKey(process.env.SG16_AI_API_KEY),
      models: getGroqStyleModels(),
    };
  }

  const groqKey =
    cleanKey(process.env.SG16_AI_API_KEY) || cleanKey(process.env.SG16_ROUTER_API_KEY);
  if (groqKey) {
    return {
      id: 'groq',
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: groqKey,
      models: getGroqStyleModels(),
    };
  }

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
    text: process.env.SG16_AI_MODEL_TEXT || 'llama-3.3-70b-versatile',
    reasoning: process.env.SG16_AI_MODEL_REASONING || 'llama-3.3-70b-versatile',
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

  const primary = provider.models.text;
  const fallbacks = (process.env.SG16_AI_MODEL_FALLBACKS || 'llama-3.1-8b-instant,gemma2-9b-it')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return [...new Set([primary, provider.models.reasoning, ...fallbacks].filter(Boolean))];
}

function getProviderChain() {
  const chain = [];
  const primary = getPrimaryProvider();
  const backup = getBackupProvider();
  if (primary) chain.push(primary);
  if (backup) chain.push(backup);
  return chain;
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

  const res = await fetch(activeProvider.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
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
}) {
  const providers = getProviderChain();
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
        if (provider.id === 'groq' || provider.id === 'custom') {
          console.warn(`SG16 ${provider.id} error on ${model}:`, err.message);
          continue;
        }
        if (provider.id === 'openrouter' || provider.id === 'backup') {
          console.warn(`SG16 ${provider.id} error on ${model}:`, err.message);
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error('SG16 AI capacity reached. Please try again shortly.');
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
    primary: primary ? primary.id : null,
    backup: backup ? backup.id : null,
    backupModel: backup?.models?.text || null,
    openRouter: backup?.id === 'openrouter',
  };
}

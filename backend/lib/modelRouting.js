import { getPrimaryProvider, getProviderChain, isProviderInCooldown } from './sg16Provider.js';

/** Workspace-aware generation settings — tuned for speed on Groq/Grok. */
export function getGenerationProfile(workspaceId, intent) {
  const isCoding = workspaceId === 'coding' || intent === 'code';
  const isGeneralChat = workspaceId === 'general' || workspaceId === 'voice';
  const isTranslate = workspaceId === 'translate';

  if (isCoding) {
    return {
      intent: 'code',
      temperature: Number(process.env.SG16_CODING_TEMPERATURE || 0.25),
      maxTokens: Number(process.env.SG16_CODING_MAX_TOKENS || 3072),
      historyLimit: Number(process.env.SG16_CODING_HISTORY || 8),
      timeoutMs: Number(process.env.SG16_CODING_TIMEOUT_MS || 75000),
    };
  }

  if (isGeneralChat || isTranslate) {
    return {
      intent: 'text',
      temperature: Number(process.env.SG16_CHAT_TEMPERATURE || 0.55),
      maxTokens: Number(process.env.SG16_CHAT_MAX_TOKENS || 1536),
      historyLimit: Number(process.env.SG16_CHAT_HISTORY || 6),
      timeoutMs: Number(process.env.SG16_CHAT_TIMEOUT_MS || 45000),
    };
  }

  if (intent === 'reasoning') {
    return {
      intent: 'reasoning',
      temperature: Number(process.env.SG16_REASONING_TEMPERATURE || 0.45),
      maxTokens: Number(process.env.SG16_REASONING_MAX_TOKENS || 2048),
      historyLimit: Number(process.env.SG16_REASONING_HISTORY || 8),
      timeoutMs: Number(process.env.SG16_REASONING_TIMEOUT_MS || 60000),
    };
  }

  return {
    intent: intent || 'text',
    temperature: Number(process.env.SG16_DEFAULT_TEMPERATURE || 0.6),
    maxTokens: Number(process.env.SG16_DEFAULT_MAX_TOKENS || 2048),
    historyLimit: Number(process.env.SG16_DEFAULT_HISTORY || 8),
    timeoutMs: Number(process.env.SG16_DEFAULT_TIMEOUT_MS || 60000),
  };
}

export function getModelChainForProfile(profile, provider = getPrimaryProvider()) {
  if (profile.intent === 'code') {
    return getCodingModelChain(provider);
  }
  if (profile.intent === 'text') {
    return getFastChatModelChain(provider);
  }
  if (profile.intent === 'reasoning') {
    return getReasoningModelChain(provider);
  }
  return getFastChatModelChain(provider);
}

function splitModels(value, fallback) {
  return (value || fallback)
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

function uniqueModels(...lists) {
  return [...new Set(lists.flat().filter(Boolean))];
}

/** Fast general chat — smaller model first for low latency. */
export function getFastChatModelChain(provider = getPrimaryProvider()) {
  if (!provider) {
    return splitModels(process.env.SG16_AI_MODEL_TEXT, 'llama-3.1-8b-instant');
  }

  if (provider.id === 'openrouter' || provider.id === 'backup') {
    return uniqueModels(
      [provider.models.text],
      [provider.models.reasoning],
      provider.models.fallbacks || [],
    );
  }

  const primary =
    process.env.SG16_AI_MODEL_TEXT ||
    provider.models.text ||
    (provider.id === 'groq' ? 'llama-3.1-8b-instant' : 'grok-2-latest');

  const fallbacks = splitModels(
    process.env.SG16_AI_MODEL_FALLBACKS,
    provider.id === 'groq'
      ? 'llama-3.3-70b-versatile,gemma2-9b-it'
      : 'grok-2-latest',
  );

  return uniqueModels([primary], fallbacks, [provider.models.reasoning]);
}

/** Coding Hub — stronger model first, fast fallback if busy. */
export function getCodingModelChain(provider = getPrimaryProvider()) {
  if (!provider) {
    return splitModels(
      process.env.SG16_AI_MODEL_CODING,
      'llama-3.3-70b-versatile,llama-3.1-8b-instant',
    );
  }

  if (provider.id === 'openrouter' || provider.id === 'backup') {
    const coding =
      process.env.SG16_AI_MODEL_CODING ||
      process.env.SG16_BACKUP_MODEL_REASONING ||
      provider.models.reasoning ||
      provider.models.text;
    return uniqueModels(
      [coding],
      splitModels(process.env.SG16_AI_MODEL_CODING_FALLBACKS, 'meta-llama/llama-3.3-70b-instruct'),
      provider.models.fallbacks || [],
    );
  }

  const primary =
    process.env.SG16_AI_MODEL_CODING ||
    provider.models.coding ||
    provider.models.reasoning ||
    (provider.id === 'groq' ? 'llama-3.3-70b-versatile' : 'grok-2-latest');

  const fallbacks = splitModels(
    process.env.SG16_AI_MODEL_CODING_FALLBACKS,
    provider.id === 'groq'
      ? 'llama-3.1-8b-instant,gemma2-9b-it'
      : 'grok-2-latest',
  );

  return uniqueModels([primary], fallbacks);
}

export function getReasoningModelChain(provider = getPrimaryProvider()) {
  if (!provider) {
    return splitModels(process.env.SG16_AI_MODEL_REASONING, 'llama-3.3-70b-versatile');
  }

  if (provider.id === 'openrouter' || provider.id === 'backup') {
    return uniqueModels(
      [provider.models.reasoning || provider.models.text],
      provider.models.fallbacks || [],
    );
  }

  const primary =
    process.env.SG16_AI_MODEL_REASONING ||
    provider.models.reasoning ||
    (provider.id === 'groq' ? 'llama-3.3-70b-versatile' : 'grok-2-latest');

  return uniqueModels(
    [primary],
    splitModels(process.env.SG16_AI_MODEL_FALLBACKS, 'llama-3.1-8b-instant'),
  );
}

export function getSpeedMode() {
  const flag = process.env.SG16_SPEED_MODE?.trim().toLowerCase();
  if (flag === 'quality' || flag === '0' || flag === 'false') return 'quality';
  return 'speed';
}

export function getActiveProviderSummary() {
  const chain = getProviderChain().filter((p) => !isProviderInCooldown(p.id));
  return {
    speedMode: getSpeedMode(),
    active: chain.map((p) => p.id),
    chatModel: getFastChatModelChain(chain[0] || getPrimaryProvider())[0] || null,
    codingModel: getCodingModelChain(chain[0] || getPrimaryProvider())[0] || null,
  };
}

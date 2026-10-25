import type { AiAdapterKind, AiProviderModels } from './types';

/**
 * Built-in AI provider presets. Every preset maps onto an adapter, so the Admin
 * panel can connect Qwen, OpenAI, DeepSeek, Anthropic, Gemini, Groq, Mistral,
 * xAI, OpenRouter, a local Ollama, or any custom OpenAI-compatible endpoint
 * without any code change — switching models is a config change, not a rebuild.
 */
export interface AiProviderPreset {
  id: string;
  name: string;
  adapter: AiAdapterKind;
  baseUrl: string;
  requiresKey: boolean;
  defaultModels: AiProviderModels;
  headers?: Record<string, string>;
  description: string;
}

const noModels = (chat: string, coding = '', vision = '', fallbacks: string[] = []): AiProviderModels => ({
  chat,
  coding,
  vision,
  audio: '',
  image: '',
  fallbacks,
});

export const AI_PROVIDER_PRESETS: readonly AiProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    adapter: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    defaultModels: {
      chat: 'gpt-4o-mini',
      coding: 'gpt-4o',
      vision: 'gpt-4o-mini',
      audio: 'whisper-1',
      image: 'gpt-image-1',
      fallbacks: ['gpt-4o-mini'],
    },
    description: 'GPT-4o family — chat, coding, vision, Whisper speech, image generation.',
  },
  {
    id: 'qwen',
    name: 'Qwen (Alibaba DashScope)',
    adapter: 'openai',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    requiresKey: true,
    defaultModels: {
      chat: 'qwen-plus',
      coding: 'qwen-max',
      vision: 'qwen-vl-max',
      audio: '',
      image: '',
      fallbacks: ['qwen-turbo', 'qwen-plus'],
    },
    description: 'Qwen models via the DashScope OpenAI-compatible endpoint (international).',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    adapter: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    defaultModels: noModels('deepseek-chat', 'deepseek-chat', '', ['deepseek-reasoner']),
    description: 'DeepSeek Chat + Reasoner — strong and inexpensive.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    adapter: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    defaultModels: noModels('claude-sonnet-4-5', 'claude-sonnet-4-5', 'claude-sonnet-4-5', ['claude-haiku-4-5']),
    description: 'Claude Sonnet/Haiku via the native Anthropic messages API.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    adapter: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresKey: true,
    defaultModels: noModels('gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash', ['gemini-2.5-pro']),
    description: 'Gemini 2.5 Flash/Pro via the native generateContent API.',
  },
  {
    id: 'groq',
    name: 'Groq',
    adapter: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    defaultModels: noModels('llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama-3.2-11b-vision-preview', [
      'llama-3.3-70b-versatile',
      'gemma2-9b-it',
    ]),
    description: 'Very fast Llama/Gemma hosting.',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    adapter: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresKey: true,
    defaultModels: noModels('mistral-small-latest', 'codestral-latest', 'pixtral-large-latest', [
      'mistral-medium-latest',
    ]),
    description: 'Mistral small/medium + Codestral for code + Pixtral for vision.',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    adapter: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    requiresKey: true,
    defaultModels: noModels('grok-3', 'grok-3', 'grok-2-vision-latest', ['grok-2-latest']),
    description: 'Grok models via the xAI OpenAI-compatible API.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    adapter: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    headers: {
      'HTTP-Referer': 'https://sg16engine.com',
      'X-Title': 'SG16 AI Engine',
    },
    defaultModels: noModels('openai/gpt-4o-mini', 'anthropic/claude-sonnet-4', 'openai/gpt-4o-mini', [
      'google/gemini-2.0-flash-001',
    ]),
    description: 'Hundreds of models through one OpenAI-compatible gateway.',
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    adapter: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    defaultModels: noModels('llama3.2', 'llama3.2', '', ['llama3.1']),
    description: 'Local models via Ollama’s OpenAI-compatible endpoint. No key needed.',
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    adapter: 'openai',
    baseUrl: '',
    requiresKey: false,
    defaultModels: noModels('', '', '', []),
    description: 'Any OpenAI-compatible endpoint: vLLM, LM Studio, Together, Fireworks, your own server.',
  },
];

export function getPreset(presetId: string): AiProviderPreset | undefined {
  return AI_PROVIDER_PRESETS.find((p) => p.id === presetId);
}

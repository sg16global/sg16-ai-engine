import { AiError, type AiAdapterKind, type AiChatMessage, type AiProviderConfig } from './types';

/**
 * Wire adapters — one per API family. Everything above this file speaks the
 * same `chat()` contract, so the rest of the app never cares whether the bytes
 * went to OpenAI, Qwen, DeepSeek, Claude, Gemini, or a local Ollama.
 */

const DEFAULT_TIMEOUT_MS = 90_000;

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}${path}`;
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p): p is { type: 'text'; text: string } => Boolean(p) && p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text)
      .join('\n');
  }
  return '';
}

function isRateLimitMessage(message: string, status: number): boolean {
  if (status === 429) return true;
  const m = message.toLowerCase();
  return (
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

function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const err = d.error;
    if (err && typeof err === 'object') {
      const msg = (err as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg) return msg;
    }
    if (typeof err === 'string' && err) return err;
    if (typeof d.message === 'string' && d.message) return d.message;
  }
  return `AI request failed (${status})`;
}

interface RawResponse {
  status: number;
  data: unknown;
}

async function requestJson(
  url: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
    signal?: AbortSignal;
    providerId?: string;
  },
): Promise<RawResponse> {
  const { method = 'GET', headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS, signal, providerId } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new AiError(
      timedOut ? 'The AI provider did not respond in time. Please try again.' : 'Could not reach the AI provider. Check your connection and try again.',
      { offline: true, providerId, code: timedOut ? 'TIMEOUT' : 'NETWORK' },
    );
  }
  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const message = extractErrorMessage(data, res.status);
    throw new AiError(message, {
      status: res.status,
      providerId,
      rateLimited: isRateLimitMessage(message, res.status),
      code: res.status === 401 || res.status === 403 ? 'AUTH' : undefined,
    });
  }
  return { status: res.status, data };
}

export interface AdapterChatParams {
  provider: AiProviderConfig;
  messages: AiChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AiAdapter {
  chat(params: AdapterChatParams): Promise<string>;
  listModels(provider: AiProviderConfig, timeoutMs?: number): Promise<string[]>;
  /** Multipart helpers are OpenAI-family only; other adapters return null. */
  transcribe?(provider: AiProviderConfig, audio: Blob, mimeType: string, model: string, language?: string): Promise<string>;
  generateImage?(provider: AiProviderConfig, prompt: string, model: string): Promise<string>;
  editImage?(provider: AiProviderConfig, prompt: string, imageDataUrl: string, model: string): Promise<string>;
}

function splitSystem(messages: AiChatMessage[]): { system: string; turns: AiChatMessage[] } {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => textOf(m.content))
    .join('\n\n')
    .trim();
  const turns = messages.filter((m) => m.role !== 'system');
  return { system, turns };
}

function dataUrlToBase64(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) return { mimeType: 'image/jpeg', data: dataUrl };
  return { mimeType: match[1] || 'image/jpeg', data: match[3] || '' };
}

/* ── OpenAI-compatible (OpenAI, Qwen/DashScope, DeepSeek, Groq, Mistral, xAI, OpenRouter, Ollama, custom) ── */

const openaiAdapter: AiAdapter = {
  async chat({ provider, messages, model, temperature, maxTokens, timeoutMs, signal }) {
    const headers: Record<string, string> = {};
    if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
    Object.assign(headers, provider.headers);
    const { data } = await requestJson(joinUrl(provider.baseUrl, '/chat/completions'), {
      method: 'POST',
      headers,
      providerId: provider.id,
      timeoutMs,
      signal,
      body: {
        model,
        messages,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      },
    });
    const content = textOf((data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content).trim();
    if (!content) throw new AiError('The AI provider returned an empty response.', { providerId: provider.id, code: 'EMPTY' });
    return content;
  },

  async listModels(provider, timeoutMs = 15_000) {
    const headers: Record<string, string> = {};
    if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
    Object.assign(headers, provider.headers);
    const { data } = await requestJson(joinUrl(provider.baseUrl, '/models'), { headers, providerId: provider.id, timeoutMs });
    const list = (data as { data?: Array<{ id?: string }> })?.data;
    if (!Array.isArray(list)) return [];
    return list.map((m) => m.id).filter((id): id is string => Boolean(id));
  },

  async transcribe(provider, audio, mimeType, model, language) {
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'wav';
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mimeType || 'audio/webm' }), `audio.${ext}`);
    form.append('model', model);
    form.append('response_format', 'json');
    if (language) form.append('language', language);
    const headers: Record<string, string> = {};
    if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
    let res: Response;
    try {
      res = await fetch(joinUrl(provider.baseUrl, '/audio/transcriptions'), {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      throw new AiError('Could not reach the AI provider for transcription.', { offline: true, providerId: provider.id });
    }
    const data = (await res.json().catch(() => ({}))) as { text?: string; error?: { message?: string } | string };
    if (!res.ok) {
      throw new AiError(typeof data.error === 'string' ? data.error : data.error?.message || 'Transcription failed', {
        status: res.status,
        providerId: provider.id,
      });
    }
    const text = String(data.text || '').trim();
    if (!text) throw new AiError('The AI provider returned no transcript.', { providerId: provider.id, code: 'EMPTY' });
    return text;
  },

  async generateImage(provider, prompt, model) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
    Object.assign(headers, provider.headers);
    const { data } = await requestJson(joinUrl(provider.baseUrl, '/images/generations'), {
      method: 'POST',
      headers,
      providerId: provider.id,
      timeoutMs: 120_000,
      body: { model, prompt: prompt.slice(0, 4000), n: 1, size: '1024x1024', response_format: 'b64_json' },
    });
    const b64 = (data as { data?: Array<{ b64_json?: string }> })?.data?.[0]?.b64_json;
    if (!b64) throw new AiError('The AI provider could not produce an image.', { providerId: provider.id, code: 'EMPTY' });
    return `data:image/png;base64,${b64}`;
  },

  async editImage(provider, prompt, imageDataUrl, model) {
    const { mimeType, data } = dataUrlToBase64(imageDataUrl);
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const form = new FormData();
    form.append('image', new Blob([bytes], { type: mimeType }), `photo.${mimeType.split('/')[1] || 'png'}`);
    form.append('prompt', prompt.slice(0, 4000));
    form.append('n', '1');
    form.append('size', '1024x1024');
    form.append('response_format', 'b64_json');
    if (model) form.append('model', model);
    const headers: Record<string, string> = {};
    if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
    let res: Response;
    try {
      res = await fetch(joinUrl(provider.baseUrl, '/images/edits'), {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      throw new AiError('Could not reach the AI provider for image editing.', { offline: true, providerId: provider.id });
    }
    const raw = (await res.json().catch(() => ({}))) as { data?: Array<{ b64_json?: string }>; error?: { message?: string } | string };
    if (!res.ok) {
      throw new AiError(typeof raw.error === 'string' ? raw.error : raw.error?.message || 'Image edit failed', {
        status: res.status,
        providerId: provider.id,
      });
    }
    const b64 = raw.data?.[0]?.b64_json;
    if (!b64) throw new AiError('The AI provider could not edit the image.', { providerId: provider.id, code: 'EMPTY' });
    return `data:image/png;base64,${b64}`;
  },
};

/* ── Anthropic (native messages API) ── */

const ANTHROPIC_VERSION = '2023-06-01';

const anthropicAdapter: AiAdapter = {
  async chat({ provider, messages, model, temperature, maxTokens, timeoutMs, signal }) {
    const { system, turns } = splitSystem(messages);
    const body = {
      model,
      max_tokens: maxTokens ?? 2048,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(system ? { system } : {}),
      messages: turns.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content:
          typeof m.content === 'string'
            ? m.content
            : m.content.map((part) => {
                if (part.type === 'text') return { type: 'text' as const, text: part.text };
                const { mimeType, data } = dataUrlToBase64(part.image_url.url);
                return { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType, data } };
              }),
      })),
    };
    const { data } = await requestJson(joinUrl(provider.baseUrl, '/messages'), {
      method: 'POST',
      providerId: provider.id,
      timeoutMs,
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        // Required for browser-direct calls to the Anthropic API.
        'anthropic-dangerous-direct-browser-access': 'true',
        ...provider.headers,
      },
      body,
    });
    const content = (data as { content?: Array<{ type: string; text?: string }> })?.content;
    const text = Array.isArray(content)
      ? content
          .filter((p) => p.type === 'text' && typeof p.text === 'string')
          .map((p) => p.text as string)
          .join('\n')
          .trim()
      : '';
    if (!text) throw new AiError('The AI provider returned an empty response.', { providerId: provider.id, code: 'EMPTY' });
    return text;
  },

  async listModels(provider, timeoutMs = 15_000) {
    const { data } = await requestJson(joinUrl(provider.baseUrl, '/models'), {
      providerId: provider.id,
      timeoutMs,
      headers: {
        'x-api-key': provider.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
        ...provider.headers,
      },
    });
    const list = (data as { data?: Array<{ id?: string }> })?.data;
    if (!Array.isArray(list)) return [];
    return list.map((m) => m.id).filter((id): id is string => Boolean(id));
  },
};

/* ── Google Gemini (native generateContent API) ── */

const geminiAdapter: AiAdapter = {
  async chat({ provider, messages, model, temperature, maxTokens, timeoutMs, signal }) {
    const { system, turns } = splitSystem(messages);
    const contents = turns.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts:
        typeof m.content === 'string'
          ? [{ text: m.content }]
          : m.content.map((part) => {
              if (part.type === 'text') return { text: part.text };
              const { mimeType, data } = dataUrlToBase64(part.image_url.url);
              return { inlineData: { mimeType, data } };
            }),
    }));
    const { data } = await requestJson(
      joinUrl(provider.baseUrl, `/models/${encodeURIComponent(model)}:generateContent`),
      {
        method: 'POST',
        providerId: provider.id,
        timeoutMs,
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey ? { 'x-goog-api-key': provider.apiKey } : {}),
          ...provider.headers,
        },
        body: {
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            ...(temperature !== undefined ? { temperature } : {}),
            ...(maxTokens !== undefined ? { maxOutputTokens: maxTokens } : {}),
          },
        },
      },
    );
    const parts = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';
    if (!text) throw new AiError('The AI provider returned an empty response.', { providerId: provider.id, code: 'EMPTY' });
    return text;
  },

  async listModels(provider, timeoutMs = 15_000) {
    const { data } = await requestJson(joinUrl(provider.baseUrl, '/models'), {
      providerId: provider.id,
      timeoutMs,
      headers: provider.apiKey ? { 'x-goog-api-key': provider.apiKey } : {},
    });
    const list = (data as { models?: Array<{ name?: string }> })?.models;
    if (!Array.isArray(list)) return [];
    return list
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
  },
};

const ADAPTERS: Record<AiAdapterKind, AiAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
};

export function getAdapter(kind: AiAdapterKind): AiAdapter {
  return ADAPTERS[kind] ?? openaiAdapter;
}

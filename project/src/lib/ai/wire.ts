import { AiError, type AiChatMessage, type AiProviderConfig } from './types';

/**
 * The one wire protocol — the standard chat-completions API.
 *
 * There are no per-vendor adapters and no list of known providers. A
 * connection is just a raw base URL, an optional API key, and model strings,
 * and every endpoint that speaks the standard protocol works:
 *
 *   POST {baseUrl}/chat/completions     Authorization: Bearer {apiKey}
 *   GET  {baseUrl}/models
 *   POST {baseUrl}/audio/transcriptions
 *   POST {baseUrl}/images/generations
 *   POST {baseUrl}/images/edits
 *
 * The browser talks to the endpoint directly — there is no SG16 server
 * in between.
 */

const DEFAULT_TIMEOUT_MS = 90_000;

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}${path}`;
}

function authHeaders(provider: AiProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
  Object.assign(headers, provider.headers);
  return headers;
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
): Promise<unknown> {
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
      timedOut ? 'The AI endpoint did not respond in time. Please try again.' : 'Could not reach the AI endpoint. Check your connection and try again.',
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
  return data;
}

function dataUrlToBase64(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) return { mimeType: 'image/jpeg', data: dataUrl };
  return { mimeType: match[1] || 'image/jpeg', data: match[3] || '' };
}

/* ── Chat ── */

export interface WireChatParams {
  provider: AiProviderConfig;
  messages: AiChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** POST {baseUrl}/chat/completions — returns the assistant's text. */
export async function wireChat(params: WireChatParams): Promise<string> {
  const { provider, messages, model, temperature, maxTokens, timeoutMs, signal } = params;
  const data = await requestJson(joinUrl(provider.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: authHeaders(provider),
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
  if (!content) throw new AiError('The AI endpoint returned an empty response.', { providerId: provider.id, code: 'EMPTY' });
  return content;
}

/* ── Model list ── */

/** GET {baseUrl}/models — lists model ids. Empty array when unsupported. */
export async function wireListModels(provider: AiProviderConfig, timeoutMs = 15_000): Promise<string[]> {
  const data = await requestJson(joinUrl(provider.baseUrl, '/models'), {
    headers: authHeaders(provider),
    providerId: provider.id,
    timeoutMs,
  });
  const list = (data as { data?: Array<{ id?: string }> })?.data;
  if (!Array.isArray(list)) return [];
  return list.map((m) => m.id).filter((id): id is string => Boolean(id));
}

/* ── Audio transcription ── */

/** POST {baseUrl}/audio/transcriptions — multipart, returns the transcript text. */
export async function wireTranscribe(
  provider: AiProviderConfig,
  audio: Blob,
  mimeType: string,
  model: string,
  language?: string,
): Promise<string> {
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'wav';
  const form = new FormData();
  form.append('file', new Blob([audio], { type: mimeType || 'audio/webm' }), `audio.${ext}`);
  form.append('model', model);
  form.append('response_format', 'json');
  if (language) form.append('language', language);
  let res: Response;
  try {
    res = await fetch(joinUrl(provider.baseUrl, '/audio/transcriptions'), {
      method: 'POST',
      headers: authHeaders(provider),
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new AiError('Could not reach the AI endpoint for transcription.', { offline: true, providerId: provider.id });
  }
  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: { message?: string } | string };
  if (!res.ok) {
    throw new AiError(typeof data.error === 'string' ? data.error : data.error?.message || 'Transcription failed', {
      status: res.status,
      providerId: provider.id,
    });
  }
  const text = String(data.text || '').trim();
  if (!text) throw new AiError('The AI endpoint returned no transcript.', { providerId: provider.id, code: 'EMPTY' });
  return text;
}

/* ── Image generation ── */

/** POST {baseUrl}/images/generations — returns a data URL. */
export async function wireGenerateImage(provider: AiProviderConfig, prompt: string, model: string): Promise<string> {
  const data = await requestJson(joinUrl(provider.baseUrl, '/images/generations'), {
    method: 'POST',
    headers: authHeaders(provider),
    providerId: provider.id,
    timeoutMs: 120_000,
    body: { model, prompt: prompt.slice(0, 4000), n: 1, size: '1024x1024', response_format: 'b64_json' },
  });
  const item = (data as { data?: Array<{ b64_json?: string; url?: string }> })?.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) return item.url;
  throw new AiError('The AI endpoint could not produce an image.', { providerId: provider.id, code: 'EMPTY' });
}

/* ── Image editing ── */

/** POST {baseUrl}/images/edits — multipart, returns a data URL. */
export async function wireEditImage(
  provider: AiProviderConfig,
  prompt: string,
  imageDataUrl: string,
  model: string,
): Promise<string> {
  const { mimeType, data } = dataUrlToBase64(imageDataUrl);
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: mimeType }), `photo.${mimeType.split('/')[1] || 'png'}`);
  form.append('prompt', prompt.slice(0, 4000));
  form.append('n', '1');
  form.append('size', '1024x1024');
  form.append('response_format', 'b64_json');
  if (model) form.append('model', model);
  let res: Response;
  try {
    res = await fetch(joinUrl(provider.baseUrl, '/images/edits'), {
      method: 'POST',
      headers: authHeaders(provider),
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new AiError('Could not reach the AI endpoint for image editing.', { offline: true, providerId: provider.id });
  }
  const raw = (await res.json().catch(() => ({}))) as { data?: Array<{ b64_json?: string; url?: string }>; error?: { message?: string } | string };
  if (!res.ok) {
    throw new AiError(typeof raw.error === 'string' ? raw.error : raw.error?.message || 'Image edit failed', {
      status: res.status,
      providerId: provider.id,
    });
  }
  const item = raw.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) return item.url;
  throw new AiError('The AI endpoint could not edit the image.', { providerId: provider.id, code: 'EMPTY' });
}

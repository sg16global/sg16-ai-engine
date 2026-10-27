import { AiError, type AiChatMessage, type AiIntent } from './types';

/**
 * The one wire — the browser talks only to SG16's own backend.
 *
 *   POST /api/ai/chat         chat, Pilot, Shields, vision
 *   POST /api/ai/transcribe   voice input (multipart)
 *   POST /api/ai/image        image creation / photo editing
 *   GET  /api/ai/status       what the engine can do (booleans only)
 *
 * The AI endpoint, keys and models are the owner's Cloudflare secrets
 * (functions/api/ai/_gateway.ts). Nothing about them reaches the browser.
 */

const DEFAULT_TIMEOUT_MS = 100_000;

async function readError(res: Response): Promise<AiError> {
  const data = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  const code = data?.error?.code;
  return new AiError(data?.error?.message || 'SG16 AI is temporarily unavailable. Please try again.', {
    status: res.status,
    code,
    rateLimited: code === 'BUSY',
    noProvider: code === 'NOT_CONFIGURED',
  });
}

async function post(path: string, body: BodyInit, init: { json?: boolean; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: init.json ? { 'Content-Type': 'application/json' } : undefined,
      body,
      signal: init.signal ?? AbortSignal.timeout(init.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new AiError(
      timedOut ? 'SG16 AI did not respond in time. Please try again.' : 'Could not reach SG16 AI. Check your connection and try again.',
      { offline: true, code: timedOut ? 'TIMEOUT' : 'NETWORK' },
    );
  }
  if (!res.ok) throw await readError(res);
  return res.json().catch(() => null);
}

/* ── Chat ── */

export interface WireChatParams {
  messages: AiChatMessage[];
  intent: AiIntent;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** POST /api/ai/chat — returns the assistant's text. */
export async function wireChat(params: WireChatParams): Promise<string> {
  const { messages, intent, temperature, maxTokens, timeoutMs, signal } = params;
  const data = (await post('/api/ai/chat', JSON.stringify({ messages, intent, temperature, maxTokens }), {
    json: true,
    timeoutMs,
    signal,
  })) as { content?: unknown } | null;
  const content = typeof data?.content === 'string' ? data.content.trim() : '';
  if (!content) throw new AiError('SG16 AI returned an empty response.', { code: 'EMPTY' });
  return content;
}

/* ── Audio transcription ── */

/** POST /api/ai/transcribe — multipart, returns the transcript text. */
export async function wireTranscribe(audio: Blob, mimeType: string, language?: string): Promise<string> {
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'wav';
  const form = new FormData();
  form.append('file', new Blob([audio], { type: mimeType || 'audio/webm' }), `audio.${ext}`);
  if (language) form.append('language', language);
  const data = (await post('/api/ai/transcribe', form, { timeoutMs: 70_000 })) as { text?: unknown } | null;
  const text = String(data?.text ?? '').trim();
  if (!text) throw new AiError('No speech was recognised. Please try again.', { code: 'EMPTY' });
  return text;
}

/* ── Images ── */

/** POST /api/ai/image — creates an image, or edits `imageDataUrl` in place. Returns a data URL. */
export async function wireImage(prompt: string, imageDataUrl?: string): Promise<string> {
  const data = (await post('/api/ai/image', JSON.stringify({ prompt, image: imageDataUrl }), {
    json: true,
    timeoutMs: 130_000,
  })) as { image?: unknown } | null;
  if (typeof data?.image === 'string' && data.image) return data.image;
  throw new AiError('SG16 AI could not produce an image. Please try again.', { code: 'EMPTY' });
}

/* ── Status ── */

export interface WireStatus {
  configured: boolean;
  vision: boolean;
  audio: boolean;
  image: boolean;
}

/** GET /api/ai/status — null when the backend cannot be reached. */
export async function wireStatus(): Promise<WireStatus | null> {
  try {
    const res = await fetch('/api/ai/status', { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<WireStatus>;
    return {
      configured: data.configured === true,
      vision: data.vision === true,
      audio: data.audio === true,
      image: data.image === true,
    };
  } catch {
    return null;
  }
}

/**
 * SG16 AI gateway — shared by the /api/ai/* Pages Functions.
 *
 * The owner configures the AI connection once, as encrypted Cloudflare Pages
 * secrets. Users never see a base URL, key or model name: the browser only
 * talks to /api/ai/*, and only these functions talk to the AI endpoint.
 *
 *   AI_BASE_URL          required  e.g. https://api.example.com/v1 (standard chat-completions API)
 *   AI_API_KEY           optional  sent as "Authorization: Bearer …" (omit for keyless endpoints)
 *   AI_CHAT_MODEL        required  general chat model
 *   AI_CODING_MODEL      optional  coding model (falls back to AI_CHAT_MODEL)
 *   AI_VISION_MODEL      optional  image questions + student ID checks (falls back to AI_CHAT_MODEL)
 *   AI_AUDIO_MODEL       optional  voice transcription
 *   AI_IMAGE_MODEL       optional  image generation / editing
 *   AI_FALLBACK_MODELS   optional  comma list, tried in order when the chat model is busy or fails
 *
 * Zero-Data Trace: nothing here logs, stores or echoes request bodies, keys or
 * upstream error text. Errors reaching the browser are short generic messages.
 */

export interface AiEnv {
  AI_BASE_URL?: string;
  AI_API_KEY?: string;
  AI_CHAT_MODEL?: string;
  AI_CODING_MODEL?: string;
  AI_VISION_MODEL?: string;
  AI_AUDIO_MODEL?: string;
  AI_IMAGE_MODEL?: string;
  AI_FALLBACK_MODELS?: string;
}

export interface AiContext {
  request: Request;
  env: AiEnv;
}

export type AiIntent = 'chat' | 'code' | 'vision' | 'reasoning';

export interface Gateway {
  baseUrl: string;
  apiKey: string;
  chat: string;
  coding: string;
  vision: string;
  audio: string;
  image: string;
  fallbacks: string[];
}

export class GatewayError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'NOT_CONFIGURED' | 'BAD_REQUEST' | 'FORBIDDEN' | 'BUSY' | 'UNAVAILABLE' | 'EMPTY' | 'UNSUPPORTED',
    message: string,
  ) {
    super(message);
  }
}

/** The owner's connection, or null when the required secrets are not set. */
export function gateway(env: AiEnv): Gateway | null {
  const baseUrl = (env.AI_BASE_URL ?? '').trim().replace(/\/+$/, '');
  const chat = (env.AI_CHAT_MODEL ?? '').trim();
  if (!baseUrl || !chat) return null;
  return {
    baseUrl,
    apiKey: (env.AI_API_KEY ?? '').trim(),
    chat,
    coding: (env.AI_CODING_MODEL ?? '').trim(),
    vision: (env.AI_VISION_MODEL ?? '').trim() || chat,
    audio: (env.AI_AUDIO_MODEL ?? '').trim(),
    image: (env.AI_IMAGE_MODEL ?? '').trim(),
    fallbacks: (env.AI_FALLBACK_MODELS ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
  };
}

export function requireGateway(env: AiEnv): Gateway {
  const gw = gateway(env);
  if (!gw) throw new GatewayError(503, 'NOT_CONFIGURED', 'SG16 AI is being set up. Please try again soon.');
  return gw;
}

/** Model chain for an intent: the slot's model first, then (chat only) the fallbacks. */
export function modelChain(gw: Gateway, intent: AiIntent): string[] {
  if (intent === 'vision') return [gw.vision];
  if (intent === 'code') return [...new Set([gw.coding || gw.chat, ...(gw.coding ? [] : gw.fallbacks)])];
  return [...new Set([gw.chat, ...gw.fallbacks])];
}

/**
 * Browser calls only: a POST must come from the page's own origin
 * (sg16engine.com, a pages.dev preview, or wrangler pages dev).
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) {
    throw new GatewayError(403, 'FORBIDDEN', 'Request not allowed.');
  }
}

/** Reject bodies over `maxBytes` before reading them. */
export function assertBodySize(request: Request, maxBytes: number): void {
  const length = Number(request.headers.get('Content-Length') || '0');
  if (length > maxBytes) throw new GatewayError(413, 'BAD_REQUEST', 'This request is too large.');
}

export function authHeaders(gw: Gateway): Record<string, string> {
  return gw.apiKey ? { Authorization: `Bearer ${gw.apiKey}` } : {};
}

/** 429 / 5xx answers mean "try the next model"; anything else is final. */
export function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

export function upstreamError(status: number): GatewayError {
  if (status === 429 || status === 503) return new GatewayError(503, 'BUSY', 'SG16 AI is busy right now. Please try again in a minute.');
  return new GatewayError(502, 'UNAVAILABLE', 'SG16 AI is temporarily unavailable. Please try again.');
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof GatewayError) return json({ error: { code: err.code, message: err.message } }, err.status);
  return json({ error: { code: 'UNAVAILABLE', message: 'SG16 AI is temporarily unavailable. Please try again.' } }, 502);
}

export function clamp(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

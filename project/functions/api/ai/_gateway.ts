/**
 * SG16 AI gateway — shared by the /api/ai/* Pages Functions.
 *
 * Model-agnostic: the project works with whatever AI the owner connects. The
 * connection is one standard chat-completions endpoint plus one model, set once
 * as Cloudflare Pages variables (Settings → Variables and Secrets). Every
 * Shield, chat, coding and photo question uses that same model — the project
 * never picks a model or a provider itself.
 *
 *   AI_BASE_URL     the endpoint, e.g. Cloudflare Workers AI:
 *                   https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1
 *   AI_API_KEY      sent as "Authorization: Bearer …" (type Secret; omit for keyless endpoints)
 *   AI_MODEL        the model, exactly as the provider names it
 *
 * Optional, only if the connected AI offers them (blank = feature off):
 *   AI_IMAGE_MODEL  image creation / photo editing (/images/generations, /images/edits)
 *   AI_AUDIO_MODEL  voice transcription for browsers without built-in speech (/audio/transcriptions)
 *
 * Zero-Data Trace: nothing here logs, stores or echoes request bodies, keys or
 * upstream error text. Errors reaching the browser are short generic messages.
 */

export interface AiEnv {
  AI_BASE_URL?: string;
  AI_API_KEY?: string;
  AI_MODEL?: string;
  AI_IMAGE_MODEL?: string;
  AI_AUDIO_MODEL?: string;
}

export interface AiContext {
  request: Request;
  env: AiEnv;
}

export interface Gateway {
  baseUrl: string;
  apiKey: string;
  model: string;
  image: string;
  audio: string;
}

export class GatewayError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'NOT_CONFIGURED' | 'BAD_REQUEST' | 'BUSY' | 'UNAVAILABLE' | 'EMPTY',
    message: string,
  ) {
    super(message);
  }
}

/** The owner's connection, or null until AI_BASE_URL and AI_MODEL are set. */
export function gateway(env: AiEnv): Gateway | null {
  const baseUrl = (env.AI_BASE_URL ?? '').trim().replace(/\/+$/, '');
  const model = (env.AI_MODEL ?? '').trim();
  if (!baseUrl || !model) return null;
  return {
    baseUrl,
    apiKey: (env.AI_API_KEY ?? '').trim(),
    model,
    image: (env.AI_IMAGE_MODEL ?? '').trim(),
    audio: (env.AI_AUDIO_MODEL ?? '').trim(),
  };
}

export function requireGateway(env: AiEnv): Gateway {
  const gw = gateway(env);
  if (!gw) throw new GatewayError(503, 'NOT_CONFIGURED', 'SG16 AI is being set up. Please try again soon.');
  return gw;
}

export function authHeaders(gw: Gateway): Record<string, string> {
  return gw.apiKey ? { Authorization: `Bearer ${gw.apiKey}` } : {};
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

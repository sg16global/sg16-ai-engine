import { setEngineStatus } from './apiStatus';

/**
 * Single entry point for every call to the SG16 backend.
 *
 * - Same origin by default (production, Capacitor app, and `npm run dev` via the Vite proxy).
 * - Set VITE_API_BASE_URL to point a frontend build at a backend on another origin.
 * - Real errors are thrown as ApiError; nothing is faked. Callers decide what to show.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 20_000;

/** Proxy / Cloudflare statuses that mean the backend never answered (502–504, Cloudflare 520–530). */
function isGatewayStatus(status: number): boolean {
  return (status >= 502 && status <= 504) || (status >= 520 && status <= 530);
}

export const API_V1 = '/api/v1';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export class ApiError extends Error {
  /** HTTP status, or 0 when the engine could not be reached at all. */
  readonly status: number;
  readonly code?: string;
  readonly data: Record<string, unknown>;
  /** The engine is unreachable or still starting — the request itself was not rejected. */
  readonly offline: boolean;

  constructor(message: string, status: number, data: Record<string, unknown> = {}, offline = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.offline = offline;
    this.code = typeof data.code === 'string' ? data.code : undefined;
  }

  get unauthorized(): boolean {
    return this.status === 401;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Serialized as JSON. */
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
}

async function readBody(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  if (!text) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : { value: parsed };
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    setEngineStatus('offline');
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    throw new ApiError(
      timedOut
        ? 'SG16 AI Engine did not respond in time. Please try again.'
        : 'Cannot reach SG16 AI Engine. Check your connection and try again.',
      0,
      {},
      true,
    );
  }

  const data = await readBody(res);

  // The backend always answers in JSON. Gateway errors, a 5xx without its JSON error body (the dev
  // proxy answers 500 with an empty body when no backend runs), or an HTML page (no proxy / wrong
  // VITE_API_BASE_URL) all mean the engine was not reached.
  const backendErrorBody = data !== null && Object.keys(data).length > 0;
  if (isGatewayStatus(res.status) || (res.status >= 500 && !backendErrorBody) || data === null) {
    setEngineStatus('offline');
    throw new ApiError(
      'SG16 AI Engine is starting up or unavailable. Please try again in a few seconds.',
      res.status,
      {},
      true,
    );
  }

  setEngineStatus('online');

  if (!res.ok) {
    const message = typeof data.error === 'string' && data.error ? data.error : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

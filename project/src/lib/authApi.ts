import type { AuthUser } from '../core/types';

export interface AuthConfigResponse {
  clientId: string;
  authorizedJavaScriptOrigins: string[];
  currentOriginHint: string;
}

const AUTH_TOKEN_KEY = 'sg16_auth_token';
const AUTH_FETCH_TIMEOUT_MS = 12_000;

function isLegacyPreviewToken(token: string) {
  return token === 'local-preview-token' || token.startsWith('local-preview');
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    signal: AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS),
  });
  return res;
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function fetchAuthConfig(): Promise<AuthConfigResponse> {
  const res = await authFetch('/api/v1/auth/config');
  const data = await res.json();
  const clientId = (data.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  return {
    clientId,
    authorizedJavaScriptOrigins: data.authorizedJavaScriptOrigins ?? [],
    currentOriginHint: data.currentOriginHint ?? '',
  };
}

export async function loginPreview(): Promise<{ token: string; user: AuthUser }> {
  const res = await authFetch('/api/v1/auth/preview', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Preview sign-in failed');
  return data;
}

export async function loginWithGoogle(credential: string): Promise<{ token: string; user: AuthUser }> {
  const res = await authFetch('/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
  return data;
}

export async function fetchAuthMe(token: string): Promise<{ user: AuthUser; subscription?: AuthUser['subscription'] }> {
  const res = await authFetch('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session expired');
  return { user: data.user as AuthUser, subscription: data.subscription };
}

export function loadAuthToken(): string | null {
  const token = readStoredToken();
  if (token && isLegacyPreviewToken(token)) {
    clearAuthToken();
    return null;
  }
  if (token) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      /* ignore storage errors */
    }
  }
  return token;
}

export function saveAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function authHeaders(): HeadersInit {
  const token = loadAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

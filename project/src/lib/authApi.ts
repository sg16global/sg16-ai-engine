import type { AuthUser } from '../core/types';

export interface AuthConfigResponse {
  clientId: string;
  authorizedJavaScriptOrigins: string[];
  currentOriginHint: string;
}

const AUTH_TOKEN_KEY = 'sg16_auth_token';

export async function fetchAuthConfig(): Promise<AuthConfigResponse> {
  const res = await fetch('/api/v1/auth/config');
  const data = await res.json();
  const clientId = (data.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  return {
    clientId,
    authorizedJavaScriptOrigins: data.authorizedJavaScriptOrigins ?? [],
    currentOriginHint: data.currentOriginHint ?? '',
  };
}

export async function loginWithGoogle(credential: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
  return data;
}

export async function fetchAuthMe(token: string): Promise<{ user: AuthUser; subscription?: AuthUser['subscription'] }> {
  const res = await fetch('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session expired');
  return { user: data.user as AuthUser, subscription: data.subscription };
}

export function loadAuthToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAuthToken(token: string) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function authHeaders(): HeadersInit {
  const token = loadAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

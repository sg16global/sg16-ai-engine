import type { AuthUser } from '../core/types';
import { API_V1, apiRequest } from './apiClient';

const AUTH_TOKEN_KEY = 'sg16_auth_token';
const AUTH_FETCH_TIMEOUT_MS = 12_000;

function isLegacyPreviewToken(token: string) {
  return token === 'local-preview-token' || token.startsWith('local-preview');
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

const DEVICE_ID_KEY = 'sg16_device_id';

function readDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

/** True once this browser has entered SG16 before (it has a device id). */
export function hasDeviceId(): boolean {
  return Boolean(readDeviceId());
}

/** Set by Logout: the device stays signed out (no silent resume) until the user presses Enter again. */
const SIGNED_OUT_KEY = 'sg16_signed_out';

export function isSignedOut(): boolean {
  try {
    return localStorage.getItem(SIGNED_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSignedOut(signedOut: boolean) {
  try {
    if (signedOut) localStorage.setItem(SIGNED_OUT_KEY, '1');
    else localStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    /* private mode */
  }
}

/** Random id kept on this device. It names the local chat history; it is not linked to any person. */
function getOrCreateDeviceId(): string {
  const existing = readDeviceId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* private mode — the session still works, history lasts for this tab only */
  }
  return id;
}

/** Anonymous session for this device — no Google account, name or email. */
export async function loginDevice(): Promise<{ token: string; user: AuthUser }> {
  const result = await apiRequest<{ token: string; user: AuthUser }>(`${API_V1}/auth/device`, {
    method: 'POST',
    body: { deviceId: getOrCreateDeviceId() },
    timeoutMs: AUTH_FETCH_TIMEOUT_MS,
  });
  saveAuthToken(result.token);
  return result;
}

export async function fetchAuthMe(token: string): Promise<{ user: AuthUser; subscription?: AuthUser['subscription'] }> {
  const data = await apiRequest<{ user: AuthUser; subscription?: AuthUser['subscription'] }>(`${API_V1}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: AUTH_FETCH_TIMEOUT_MS,
  });
  return { user: data.user, subscription: data.subscription };
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

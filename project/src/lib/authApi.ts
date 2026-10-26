import type { AuthUser } from '../core/types';
import { readLaunchConfig } from './billingApi';
import { loadSubscription } from './utils';

/**
 * Local device sessions — no server, no accounts, no Google.
 *
 * Each browser gets an anonymous device id (localStorage). "Entering SG16"
 * mints a local token for that device; chat history stays on the device and
 * is keyed by it. Nothing is sent anywhere — the app is fully self-contained.
 */

const AUTH_TOKEN_KEY = 'sg16_auth_token';
const DEVICE_ID_KEY = 'sg16_device_id';
const FIRST_SEEN_KEY = 'sg16_first_seen';

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

/** When this device first entered SG16 — drives the local 3-day trial clock. */
function getOrCreateFirstSeen(): number {
  try {
    const raw = localStorage.getItem(FIRST_SEEN_KEY);
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const now = Date.now();
    localStorage.setItem(FIRST_SEEN_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/** The anonymous user this device session presents — built locally, never fetched. */
function buildDeviceUser(): AuthUser {
  return {
    id: getOrCreateDeviceId(),
    signupDate: getOrCreateFirstSeen(),
    name: 'SG16 User',
    launchFree: readLaunchConfig().launchFree,
    trialActive: false,
    trialDaysRemaining: 0,
    subscription: loadSubscription(),
  };
}

/** Anonymous session for this device — no Google account, name or email. Always succeeds. */
export async function loginDevice(): Promise<{ token: string; user: AuthUser }> {
  const user = buildDeviceUser();
  const token = `sg16.${user.id}.${crypto.randomUUID()}`;
  saveAuthToken(token);
  return { token, user };
}

/** The local session behind a token — throws when the token does not match this device. */
export async function fetchAuthMe(token: string): Promise<{ user: AuthUser; subscription?: AuthUser['subscription'] }> {
  const deviceId = readDeviceId();
  if (!deviceId || !token.startsWith(`sg16.${deviceId}.`)) {
    throw new Error('Session expired. Please enter SG16 again.');
  }
  const user = buildDeviceUser();
  return { user, subscription: user.subscription };
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

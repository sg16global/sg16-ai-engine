/**
 * Google OAuth — frontend client ID (Vite exposes VITE_* vars at build time).
 *
 * Put your real Client ID in:  project/.env
 *   VITE_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
 *
 * Use the SAME value in backend/.env as GOOGLE_CLIENT_ID (server verifies tokens).
 */
export function sanitizeGoogleClientId(raw: string): string {
  return raw.replace(/^\uFEFF/, '').trim().replace(/^["']|["']$/g, '');
}

export const GOOGLE_CLIENT_ID = sanitizeGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '');

export const hasGoogleClientId =
  GOOGLE_CLIENT_ID.length > 0 &&
  /^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID);

/** Origins that must be registered in Google Cloud Console (JavaScript origins). */
export const GOOGLE_AUTHORIZED_ORIGINS = [
  'http://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8000',
  'https://sg16engine.com',
  'https://www.sg16engine.com',
] as const;

export function getPageOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export function isLocalDevOrigin(origin = getPageOrigin()): boolean {
  return (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.startsWith('http://[::1]')
  );
}

export function originAllowedForGoogle(origin = getPageOrigin()): boolean {
  return (GOOGLE_AUTHORIZED_ORIGINS as readonly string[]).includes(origin);
}

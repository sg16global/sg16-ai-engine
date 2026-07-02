import {
  GOOGLE_CLIENT_ID,
  getPageOrigin,
  isLocalDevOrigin,
  originAllowedForGoogle,
  sanitizeGoogleClientId,
} from '../config/googleAuth';
import { fetchAuthConfig } from './authApi';

const GSI_SCRIPT_BASE = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;
let loadedScriptClientId: string | null = null;
let initializedClientId: string | null = null;
let credentialHandler: ((credential: string) => void) | null = null;

/** Google OAuth Web client IDs always end with this suffix. */
export function isValidGoogleClientId(id: string): boolean {
  return /^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(sanitizeGoogleClientId(id));
}

export async function resolveGoogleClientId(): Promise<string> {
  const fromEnv = sanitizeGoogleClientId(GOOGLE_CLIENT_ID);
  if (isValidGoogleClientId(fromEnv)) return fromEnv;

  try {
    const { clientId } = await fetchAuthConfig();
    const fromApi = sanitizeGoogleClientId(clientId);
    if (isValidGoogleClientId(fromApi)) return fromApi;
  } catch {
    /* backend may be offline during dev */
  }

  return '';
}

export function validateGoogleAuthEnvironment(clientId: string): string | null {
  const origin = getPageOrigin();

  if (!isValidGoogleClientId(clientId)) {
    return 'Google Client ID is missing or malformed. Check VITE_GOOGLE_CLIENT_ID in project/.env.';
  }

  if (!originAllowedForGoogle(origin)) {
    return (
      `Browser origin "${origin}" is not a registered dev origin. ` +
      'Open http://localhost:5173 (not 127.0.0.1 or port 8000 unless those origins are in Google Console).'
    );
  }

  return null;
}

export function loadGsiScript(clientId: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser'));
  }

  const id = sanitizeGoogleClientId(clientId);
  if (!isValidGoogleClientId(id)) {
    return Promise.reject(new Error('Invalid Google Client ID'));
  }

  if (window.google?.accounts?.id && loadedScriptClientId === id) {
    return Promise.resolve();
  }

  const scriptSrc = `${GSI_SCRIPT_BASE}?client_id=${encodeURIComponent(id)}`;
  const existing = document.querySelector<HTMLScriptElement>(`script[src^="${GSI_SCRIPT_BASE}"]`);

  if (existing) {
    if (existing.src !== scriptSrc) {
      existing.remove();
      scriptLoadPromise = null;
      loadedScriptClientId = null;
    } else if (window.google?.accounts?.id) {
      loadedScriptClientId = id;
      return Promise.resolve();
    }
  }

  if (!scriptLoadPromise || loadedScriptClientId !== id) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        loadedScriptClientId = id;
        resolve();
      };
      script.onerror = () => {
        scriptLoadPromise = null;
        loadedScriptClientId = null;
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

/** GIS allows one initialize() per page — guarded here. */
export function initGoogleIdentity(clientId: string, onCredential: (credential: string) => void): void {
  const id = sanitizeGoogleClientId(clientId);
  credentialHandler = onCredential;

  const gsi = window.google?.accounts?.id;
  if (!gsi) {
    throw new Error('Google Identity Services is not loaded');
  }

  if (initializedClientId === id) return;

  const origin = getPageOrigin();
  const config: Record<string, unknown> = {
    client_id: id,
    callback: (response: { credential?: string }) => {
      if (response.credential && credentialHandler) {
        credentialHandler(response.credential);
      }
    },
    ux_mode: 'popup',
    use_fedcm_for_prompt: false,
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
    context: 'signin',
  };

  // Redirect URI is not used in popup credential flow — only JavaScript origins matter.
  // For local HTTP, Google requires Referrer-Policy: no-referrer-when-downgrade (see vite/server headers).
  if (isLocalDevOrigin(origin)) {
    config.ux_mode = 'popup';
  }

  gsi.initialize(config);
  initializedClientId = id;
}

export function renderGoogleSignInButton(
  container: HTMLElement,
  options?: { width?: number; theme?: string },
): void {
  const gsi = window.google?.accounts?.id;
  if (!gsi) {
    throw new Error('Google Identity Services is not loaded');
  }

  container.replaceChildren();
  gsi.renderButton(container, {
    type: 'standard',
    theme: options?.theme ?? 'filled_black',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    width: options?.width ?? 280,
  });
}

export function getGoogleOriginSetupHint(): string {
  const origin = getPageOrigin();
  return (
    `Register these Authorized JavaScript origins in Google Cloud Console for client ` +
    `${GOOGLE_CLIENT_ID.slice(0, 12)}…:\n` +
    `• http://localhost\n` +
    `• http://localhost:5173\n` +
    `• https://sg16engine.com\n\n` +
    `Your browser is currently on: ${origin}`
  );
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    initializedClientId = null;
    scriptLoadPromise = null;
    loadedScriptClientId = null;
  });
}

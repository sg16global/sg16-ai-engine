import { useEffect, useSyncExternalStore } from 'react';

import { wireStatus } from './ai/wire';
import { liveSearchAvailable } from './ai/webSearch';

/**
 * Engine status — the browser's network plus SG16's own backend.
 *
 * Status is driven by real AI traffic (lib/ai/client.ts calls
 * setEngineStatus after every call) and by the browser's network state;
 * `checkEngineHealth` asks the backend (GET /api/ai/status) whether the
 * owner's AI is configured.
 */

export type EngineStatus = 'online' | 'offline' | 'checking';

const ONLINE_RECHECK_MS = 60_000;
const OFFLINE_RETRY_MS = 15_000;

let status: EngineStatus = 'checking';
const listeners = new Set<() => void>();

/** What the backend AI can do (for the Shield Home status bar). */
export interface EngineHealth {
  aiConfigured: boolean;
  liveSearch: boolean;
}
let health: EngineHealth = { aiConfigured: false, liveSearch: true };

/** Called by the AI client after every request, so status reflects real traffic, not pings. */
export function setEngineStatus(next: EngineStatus) {
  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener());
}

export function getEngineStatus(): EngineStatus {
  return status;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyHealth() {
  listeners.forEach((listener) => listener());
}

/** Re-read the backend AI status and the browser's network state. */
export async function checkEngineHealth(): Promise<boolean> {
  const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  const backend = browserOnline ? await wireStatus() : null;
  health = {
    aiConfigured: backend?.configured ?? false,
    liveSearch: liveSearchAvailable(),
  };
  const online = browserOnline && backend !== null;
  notifyHealth();
  setEngineStatus(online ? 'online' : 'offline');
  return online;
}

export function useEngineHealth(): EngineHealth {
  return useSyncExternalStore(subscribe, () => health, () => health);
}

/** Live engine connection status shared by every component. */
export function useEngineStatus(): EngineStatus {
  return useSyncExternalStore(subscribe, getEngineStatus, getEngineStatus);
}

/**
 * Mount once at the app root: checks on start, re-checks quickly while offline,
 * slowly while online, and immediately when the browser regains network or focus.
 */
export function useEngineConnectionMonitor() {
  const current = useEngineStatus();

  useEffect(() => {
    void checkEngineHealth();
    const recheck = () => void checkEngineHealth();
    window.addEventListener('online', recheck);
    window.addEventListener('focus', recheck);
    return () => {
      window.removeEventListener('online', recheck);
      window.removeEventListener('focus', recheck);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => void checkEngineHealth(), current === 'online' ? ONLINE_RECHECK_MS : OFFLINE_RETRY_MS);
    return () => clearInterval(id);
  }, [current]);
}

import { useEffect, useSyncExternalStore } from 'react';

import { useAiConfigStore } from '../core/aiConfigStore';
import { isProviderUsable, providerChain } from './ai/config';

/**
 * Engine status — the app's own connectivity, no server involved.
 *
 * The app is self-contained: the "engine" is this browser plus the AI
 * providers configured in Admin. Status is driven by real AI traffic
 * (lib/ai/client.ts calls setEngineStatus after every call) and by the
 * browser's network state; `checkEngineHealth` reports what is configured.
 */

export type EngineStatus = 'online' | 'offline' | 'checking';

const ONLINE_RECHECK_MS = 60_000;
const OFFLINE_RETRY_MS = 15_000;

let status: EngineStatus = 'checking';
const listeners = new Set<() => void>();

/** What the configured AI connection can do (for the Shield Home status bar). */
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

/** Re-read the AI configuration and the browser's network state. */
export async function checkEngineHealth(): Promise<boolean> {
  const state = useAiConfigStore.getState();
  const usable = providerChain(state.providers).some(isProviderUsable);
  health = {
    aiConfigured: usable,
    liveSearch: state.options.liveSearch,
  };
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
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

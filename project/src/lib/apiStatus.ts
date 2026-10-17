import { useEffect, useSyncExternalStore } from 'react';
import { apiRequest } from './apiClient';

export type EngineStatus = 'online' | 'offline' | 'checking';

const HEALTH_TIMEOUT_MS = 5_000;
const ONLINE_RECHECK_MS = 60_000;
const OFFLINE_RETRY_MS = 15_000;

let status: EngineStatus = 'checking';
const listeners = new Set<() => void>();

/** Called by apiClient after every request, so status reflects real traffic, not just health pings. */
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

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const data = await apiRequest<{ status?: string }>('/health', { timeoutMs: HEALTH_TIMEOUT_MS });
    const ok = data?.status === 'ok';
    setEngineStatus(ok ? 'online' : 'offline');
    return ok;
  } catch {
    return false;
  }
}

/** Live engine connection status shared by every component. */
export function useEngineStatus(): EngineStatus {
  return useSyncExternalStore(subscribe, getEngineStatus, getEngineStatus);
}

/**
 * Mount once at the app root: checks health on start, re-checks quickly while offline,
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

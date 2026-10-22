import { useCallback, useSyncExternalStore } from 'react';
import { uid } from './utils';

/**
 * Shield tools keep their records on this device (localStorage), like chat history.
 * Nothing here needs a server, so the tools keep working when the AI or network is down.
 */
const PREFIX = 'sg16_tool_';
const listeners = new Map<string, Set<() => void>>();
const snapshots = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (snapshots.has(key)) return snapshots.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    /* private mode or bad data — start empty */
  }
  snapshots.set(key, value);
  return value;
}

function write<T>(key: string, value: T) {
  snapshots.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full — keep the in-memory copy for this session */
  }
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribe(key: string, fn: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => listeners.get(key)?.delete(fn);
}

if (typeof window !== 'undefined') {
  // Keep two open tabs in step.
  window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith(PREFIX)) return;
    const key = e.key.slice(PREFIX.length);
    snapshots.delete(key);
    listeners.get(key)?.forEach((fn) => fn());
  });
}

/** Read a stored value outside React (Pilot reminders, dashboards). */
export function readLocal<T>(key: string, fallback: T): T {
  return read(key, fallback);
}

export function writeLocal<T>(key: string, value: T) {
  write(key, value);
}

const EMPTY: never[] = [];

export type LocalRecord = { id: string; createdAt: number };

/** A list of records (homework, medicines, alerts…) saved on this device. */
export function useLocalCollection<T extends LocalRecord>(key: string) {
  const items = useSyncExternalStore(
    (fn) => subscribe(key, fn),
    () => read<T[]>(key, EMPTY as T[]),
    () => EMPTY as T[],
  );

  const add = useCallback(
    (item: Omit<T, 'id' | 'createdAt'>) => {
      const record = { ...item, id: uid(), createdAt: Date.now() } as T;
      write(key, [...read<T[]>(key, []), record]);
      return record;
    },
    [key],
  );
  const update = useCallback(
    (id: string, patch: Partial<T>) =>
      write(
        key,
        read<T[]>(key, []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      ),
    [key],
  );
  const remove = useCallback(
    (id: string) => write(key, read<T[]>(key, []).filter((r) => r.id !== id)),
    [key],
  );

  return { items, add, update, remove };
}

/** A single saved object (e.g. the student profile). */
export function useLocalValue<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    (fn) => subscribe(key, fn),
    () => read<T>(key, fallback),
    () => fallback,
  );
  const set = useCallback((next: T) => write(key, next), [key]);
  return [value, set] as const;
}

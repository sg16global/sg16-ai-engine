export type EngineStatus = 'online' | 'offline' | 'checking';

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch('/health', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

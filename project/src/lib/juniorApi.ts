import { authHeaders } from './authApi';

export interface JuniorRunResult {
  reply: string;
  brain?: string;
  model?: string;
  ownerAway?: boolean;
}

export interface JuniorHealth {
  status: string;
  brain?: string;
  ownerAway?: boolean;
  developer?: {
    ownerName?: string;
    name?: string;
  };
  permissions?: {
    mode?: string;
  };
}

export async function fetchJuniorHealth(): Promise<JuniorHealth> {
  const res = await fetch('/api/v1/personal-developer/health');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Developer health unavailable');
  return data;
}

export async function runJunior(message: string, history: { role: string; content: string }[]): Promise<JuniorRunResult> {
  const res = await fetch('/api/v1/personal-developer/run', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'AUTH_REQUIRED' || res.status === 401) throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'Developer is temporarily unavailable');
  }
  return data;
}

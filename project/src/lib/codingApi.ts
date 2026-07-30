import type { CodingUsage } from '../core/types';
import { authHeaders } from './authApi';

export class CodingLimitError extends Error {
  codingUsage: CodingUsage;

  constructor(message: string, codingUsage: CodingUsage) {
    super(message);
    this.name = 'CodingLimitError';
    this.codingUsage = codingUsage;
  }
}

export async function fetchCodingUsage(): Promise<CodingUsage> {
  const res = await fetch('/api/v1/coding/usage', { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'AUTH_REQUIRED') throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'Could not load coding tokens');
  }
  return data.codingUsage as CodingUsage;
}

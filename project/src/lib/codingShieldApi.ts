import { API_V1, ApiError, apiRequest } from './apiClient';
import { authHeaders } from './authApi';

export type ShieldCategory = {
  score: number;
  issues: number;
  tools: string[];
};

export type ShieldScanResponse = {
  ok: boolean;
  shield: string;
  subdomain?: string;
  score: number;
  grade: string;
  mode: 'fast' | 'deep';
  language: string;
  categories: Record<string, ShieldCategory>;
  topFixes: { tool: string; summary: string }[];
  tools: { tool: string; ok: boolean; summary: string; skipped?: boolean }[];
  scannedAt: string;
  error?: string;
  upgrade?: boolean;
};

export async function scanWithCodingShield(payload: {
  code: string;
  language?: string;
  mode?: 'fast' | 'deep';
}): Promise<ShieldScanResponse> {
  try {
    return await apiRequest<ShieldScanResponse>(`${API_V1}/coding-shield/scan`, {
      method: 'POST',
      headers: authHeaders(),
      body: payload,
      timeoutMs: 60_000,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      throw Object.assign(new Error(err.message), { status: err.status, upgrade: err.data.upgrade === true });
    }
    throw err;
  }
}

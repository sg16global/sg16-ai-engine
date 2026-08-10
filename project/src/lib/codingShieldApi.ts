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
  const res = await fetch('/api/v1/coding-shield/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as ShieldScanResponse & { error?: string; upgrade?: boolean };
  if (!res.ok) {
    throw Object.assign(new Error(data.error || 'Shield scan failed'), {
      status: res.status,
      upgrade: data.upgrade,
    });
  }
  return data;
}

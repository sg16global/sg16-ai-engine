import { API_V1, ApiError, apiRequest } from './apiClient';
import { authHeaders } from './authApi';

export type ShieldCategory = {
  /** null when no tool checked this category */
  score: number | null;
  issues: number;
  tools: string[];
};

export type ShieldIssue = {
  tool: string;
  category: string;
  line: number | null;
  message: string;
  severity: 'error' | 'warning';
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
  issues: ShieldIssue[];
  topFixes: { tool: string; summary: string }[];
  tools: { tool: string; ok: boolean; summary: string; skipped?: boolean }[];
  /** true when some checks do not apply to this language */
  limited: boolean;
  /** code after ESLint's safe automatic fixes, when it changed anything */
  fixedCode: string | null;
  dependencies: { manager: 'npm' | 'pip' | null; packages: string[]; installCommand: string | null };
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
      timeoutMs: 120_000,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      throw Object.assign(new Error(err.message), { status: err.status, upgrade: err.data.upgrade === true });
    }
    throw err;
  }
}

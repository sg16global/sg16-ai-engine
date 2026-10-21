import { API_V1, apiRequest } from './apiClient';

/** Admin session lives in this tab only — closing the tab signs the owner out. */
const ADMIN_TOKEN_KEY = 'sg16_admin_token';

export interface BrainProbe {
  ok: boolean;
  latencyMs?: number;
  model?: string | null;
  sample?: string;
  error?: string;
  checkedAt: number;
}

export interface AiConnection {
  connected: boolean;
  url: string | null;
  format: 'openai' | 'sg16-brain' | null;
  model: string | null;
  visionModel: string | null;
  keySet: boolean;
  keyHint: string | null;
  savedFromPanel: boolean;
  activeProvider: string | null;
}

export interface AdminStatus {
  engine: { status: string; startedAt: number; uptimeSec: number; node: string };
  ai: AiConnection;
  brain: BrainProbe | null;
  liveSearch: 'ready' | 'off';
  database: { enabled: boolean; ok: boolean; users?: number; error?: string };
  adminEmail: string;
}

export interface ConnectionInput {
  url: string;
  key: string;
  model: string;
  visionModel: string;
  /** Blank key keeps the saved one. */
  keepKey: boolean;
}

export function loadAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAdminToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* private mode — session only in memory */
  }
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export function adminLogin(email: string, password: string) {
  return apiRequest<{ token: string; email: string }>(`${API_V1}/admin/login`, {
    method: 'POST',
    body: { email, password },
  });
}

export function fetchAdminStatus(token: string, probe = false) {
  return apiRequest<AdminStatus>(`${API_V1}/admin/status${probe ? '?probe=1' : ''}`, {
    headers: auth(token),
    timeoutMs: 200_000,
  });
}

export function testConnection(token: string, input?: ConnectionInput) {
  return apiRequest<{ brain: BrainProbe }>(`${API_V1}/admin/test`, {
    method: 'POST',
    headers: auth(token),
    body: input ?? {},
    timeoutMs: 200_000,
  });
}

export function saveConnection(token: string, input: ConnectionInput) {
  return apiRequest<{ ai: AiConnection; brain: BrainProbe | null }>(`${API_V1}/admin/connection`, {
    method: 'PUT',
    headers: auth(token),
    body: input,
    timeoutMs: 200_000,
  });
}

export function changeAdminPassword(token: string, current: string, next: string) {
  return apiRequest<{ ok: boolean; token: string }>(`${API_V1}/admin/password`, {
    method: 'POST',
    headers: auth(token),
    body: { current, next },
  });
}

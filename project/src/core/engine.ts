import type { RouteResponse, WorkspaceId } from './types';
import { authHeaders } from '../lib/authApi';

const VALID: WorkspaceId[] = [
  'coding', 'developer', 'health', 'student-shield', 'general', 'market',
  'image', 'translate', 'document', 'voice', 'memory',
];

const LEGACY_MAP: Partial<Record<WorkspaceId, WorkspaceId>> = {
  image: 'general',
  document: 'health',
  translate: 'general',
  voice: 'general',
  memory: 'general',
};

function normalize(value: string): WorkspaceId {
  const raw = VALID.includes(value as WorkspaceId) ? (value as WorkspaceId) : 'general';
  return LEGACY_MAP[raw] ?? raw;
}

export function fallbackRoute(query: string): RouteResponse {
  const lower = query.toLowerCase();

  if (/code|python|debug|program|javascript|typescript|react|api|refactor|score (my )?project/.test(lower)) {
    return { targetWorkspace: 'coding', confidence: 0.85, cleanedPrompt: query };
  }
  if (/health|symptom|blood test|doctor|wellness|diet|sleep|fever|medical report/.test(lower)) {
    return { targetWorkspace: 'health', confidence: 0.88, cleanedPrompt: query };
  }
  if (/student|homework|math|physics|exam|study|school|essay|learn/.test(lower)) {
    return { targetWorkspace: 'student-shield', confidence: 0.9, cleanedPrompt: query };
  }
  if (/market|stock|crypto|bitcoin|forex|nasdaq|s&p|invest|trading|share price/.test(lower)) {
    return { targetWorkspace: 'market', confidence: 0.88, cleanedPrompt: query };
  }

  return { targetWorkspace: 'general', confidence: 0.6, cleanedPrompt: query };
}

export async function detectIntent(query: string): Promise<RouteResponse> {
  try {
    const res = await fetch('/api/v1/route', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return {
      targetWorkspace: normalize(data.targetWorkspace),
      confidence: data.confidence ?? 0.7,
      cleanedPrompt: data.cleanedPrompt ?? query,
    };
  } catch {
    return fallbackRoute(query);
  }
}

import type { RouteResponse, WorkspaceId } from './types';
import { authHeaders } from '../lib/authApi';

const VALID: WorkspaceId[] = [
  'coding', 'image', 'student-shield', 'translate', 'document', 'voice', 'memory', 'general',
];

function normalize(value: string): WorkspaceId {
  return VALID.includes(value as WorkspaceId) ? (value as WorkspaceId) : 'general';
}

export function fallbackRoute(query: string): RouteResponse {
  const lower = query.toLowerCase();

  if (/code|python|debug|program|javascript|typescript|react|api/.test(lower)) {
    return { targetWorkspace: 'coding', confidence: 0.85, cleanedPrompt: query };
  }
  if (/image|photo|picture|draw|visual|edit image|generate picture/.test(lower)) {
    return { targetWorkspace: 'image', confidence: 0.88, cleanedPrompt: query };
  }
  if (/student|homework|math|physics|exam|study|school|essay|learn/.test(lower)) {
    return { targetWorkspace: 'student-shield', confidence: 0.9, cleanedPrompt: query };
  }
  if (/translate|language|malay|spanish|french|arabic|chinese|japanese|korean/.test(lower)) {
    return { targetWorkspace: 'translate', confidence: 0.85, cleanedPrompt: query };
  }
  if (/document|pdf|summarize|summary|analyze doc|report/.test(lower)) {
    return { targetWorkspace: 'document', confidence: 0.87, cleanedPrompt: query };
  }
  if (/voice|speak|speech|audio|microphone/.test(lower)) {
    return { targetWorkspace: 'voice', confidence: 0.8, cleanedPrompt: query };
  }
  if (/memory|remember|recall|save|vault|note/.test(lower)) {
    return { targetWorkspace: 'memory', confidence: 0.75, cleanedPrompt: query };
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

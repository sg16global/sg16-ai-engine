import type { RouteResponse, WorkspaceId } from '../../core/types';
import { chatCompletion } from './client';

/**
 * Intent routing — decide which shield should answer a prompt.
 *
 * The connected AI model routes when it can; a local keyword fallback answers
 * instantly when no model is connected or the call fails. Ported from the old
 * server router (backend/lib/router.js + core/engine.ts).
 */

const VALID: WorkspaceId[] = [
  'coding', 'health', 'student-shield', 'general', 'market',
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

/** Local keyword routing — instant, works with no AI connected. */
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

const ROUTER_SYSTEM = `You route prompts for SG16 AI Engine, an app with shields: general (AI chat), coding, health, student-shield, market, image, translate, document, voice, memory.
Reply with ONLY a JSON object, no markdown:
{ "targetWorkspace": one of ["general","coding","health","student-shield","market","image","translate","document","voice","memory"], "confidence": number 0-1, "cleanedPrompt": the prompt to send to that shield (original wording, trimmed) }`;

function extractJson(text: string): { targetWorkspace?: unknown; confidence?: unknown; cleanedPrompt?: unknown } | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** AI routing with a local fallback — never throws. */
export async function routeIntent(query: string): Promise<RouteResponse> {
  const trimmed = query.trim();
  if (!trimmed) return fallbackRoute(trimmed);
  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: ROUTER_SYSTEM },
        { role: 'user', content: trimmed },
      ],
      intent: 'chat',
      temperature: 0,
      maxTokens: 160,
      timeoutMs: 20_000,
    });
    const parsed = extractJson(result.content);
    if (!parsed) return fallbackRoute(trimmed);
    return {
      targetWorkspace: normalize(typeof parsed.targetWorkspace === 'string' ? parsed.targetWorkspace : 'general'),
      confidence: typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1 ? parsed.confidence : 0.7,
      cleanedPrompt: typeof parsed.cleanedPrompt === 'string' && parsed.cleanedPrompt.trim() ? parsed.cleanedPrompt.trim() : trimmed,
    };
  } catch {
    return fallbackRoute(trimmed);
  }
}

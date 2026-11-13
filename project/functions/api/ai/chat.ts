/**
 * POST /api/ai/chat — every chat, Pilot, Shield and photo question.
 *
 * Body: { messages: [{ role, content }], temperature?, maxTokens? }
 * Reply: { content }
 *
 * Sends the conversation to the owner's AI (AI_BASE_URL, AI_MODEL — see
 * _gateway.ts). Messages are tidied, never refused: unknown roles become
 * "user", unusable parts are dropped, and very long histories keep their
 * system prompt plus the latest turns.
 */

import {
  type AiContext,
  GatewayError,
  authHeaders,
  clamp,
  errorResponse,
  json,
  requireGateway,
  upstreamError,
} from './_gateway';

const MAX_TURNS = 80;
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 90_000;
const ROLES = ['system', 'user', 'assistant'];

type Part = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
type Message = { role: string; content: string | Part[] };

function cleanPart(raw: unknown): Part | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (p.type === 'text' && typeof p.text === 'string') return { type: 'text', text: p.text };
  const url = (p.image_url as Record<string, unknown> | undefined)?.url;
  if (p.type === 'image_url' && typeof url === 'string' && url) return { type: 'image_url', image_url: { url } };
  return null;
}

function cleanMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const role = ROLES.includes(m.role as string) ? (m.role as string) : 'user';
  if (typeof m.content === 'string') return m.content.trim() ? { role, content: m.content } : null;
  if (Array.isArray(m.content)) {
    const parts = m.content.map(cleanPart).filter((p): p is Part => p !== null);
    return parts.length ? { role, content: parts } : null;
  }
  return null;
}

/** Usable messages: system prompts first, then the latest MAX_TURNS turns. */
function cleanMessages(raw: unknown): Message[] {
  const all = (Array.isArray(raw) ? raw : []).map(cleanMessage).filter((m): m is Message => m !== null);
  const system = all.filter((m) => m.role === 'system');
  const turns = all.filter((m) => m.role !== 'system').slice(-MAX_TURNS);
  if (!turns.length) throw new GatewayError(400, 'BAD_REQUEST', 'Please type a message.');
  return [...system, ...turns];
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text as string)
      .join('\n');
  }
  return '';
}

/** Reply text from a chat-completions answer (also accepts a plain `response` / `result.response`). */
function replyOf(data: unknown): string {
  const d = data as {
    choices?: Array<{ message?: { content?: unknown } }>;
    response?: unknown;
    result?: { response?: unknown };
  } | null;
  return textOf(d?.choices?.[0]?.message?.content ?? d?.response ?? d?.result?.response);
}

export async function onRequestPost(context: AiContext): Promise<Response> {
  try {
    const gw = requireGateway(context.env);

    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
    const messages = cleanMessages(body?.messages);
    const temperature = clamp(body?.temperature, 0, 2);
    const maxTokens = clamp(body?.maxTokens, 1, MAX_TOKENS);

    let res: Response;
    try {
      res = await fetch(`${gw.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(gw) },
        body: JSON.stringify({
          model: gw.model,
          messages,
          ...(temperature !== undefined ? { temperature } : {}),
          ...(maxTokens !== undefined ? { max_tokens: Math.round(maxTokens) } : {}),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw upstreamError(502);
    }
    if (!res.ok) throw upstreamError(res.status);
    const content = replyOf(await res.json().catch(() => null)).trim();
    if (!content) throw new GatewayError(502, 'EMPTY', 'SG16 AI returned an empty response. Please try again.');
    return json({ content });
  } catch (err) {
    return errorResponse(err);
  }
}

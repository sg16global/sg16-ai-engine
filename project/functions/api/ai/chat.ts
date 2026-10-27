/**
 * POST /api/ai/chat — every chat, Pilot, Shield and vision reply.
 *
 * Body: { messages: [{ role, content }], intent?, temperature?, maxTokens? }
 * Reply: { content }
 *
 * Picks the model for the intent from the owner's secrets (see _gateway.ts),
 * then walks the fallback models when one is busy or down.
 */

import {
  type AiContext,
  type AiIntent,
  GatewayError,
  assertBodySize,
  assertSameOrigin,
  authHeaders,
  clamp,
  errorResponse,
  isRetryable,
  json,
  modelChain,
  requireGateway,
  upstreamError,
} from './_gateway';

const MAX_BODY_BYTES = 12 * 1024 * 1024; // room for one or two photos as data URLs
const MAX_MESSAGES = 80;
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 90_000;
const INTENTS: AiIntent[] = ['chat', 'code', 'vision', 'reasoning'];
const ROLES = ['system', 'user', 'assistant'];

type Message = { role: string; content: unknown };

function isPart(part: unknown): boolean {
  if (!part || typeof part !== 'object') return false;
  const p = part as Record<string, unknown>;
  if (p.type === 'text') return typeof p.text === 'string';
  if (p.type === 'image_url') {
    const url = (p.image_url as Record<string, unknown> | undefined)?.url;
    return typeof url === 'string' && (url.startsWith('data:image/') || url.startsWith('https://'));
  }
  return false;
}

function validMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_MESSAGES) {
    throw new GatewayError(400, 'BAD_REQUEST', 'Message is required.');
  }
  return raw.map((m) => {
    const msg = m as Record<string, unknown>;
    const okContent = typeof msg?.content === 'string' || (Array.isArray(msg?.content) && msg.content.every(isPart));
    if (!msg || !ROLES.includes(msg.role as string) || !okContent) {
      throw new GatewayError(400, 'BAD_REQUEST', 'Message is not valid.');
    }
    return { role: msg.role as string, content: msg.content };
  });
}

function hasImage(messages: Message[]): boolean {
  return messages.some((m) => Array.isArray(m.content) && m.content.some((p) => p && p.type === 'image_url'));
}

/**
 * A photo the endpoint refuses (4xx other than auth / rate limit) means the
 * connected AI is text-only — say so, instead of "try again later".
 */
function photoRefused(status: number, withImage: boolean): boolean {
  return withImage && status >= 400 && status < 500 && status !== 401 && status !== 403 && status !== 429;
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

export async function onRequestPost(context: AiContext): Promise<Response> {
  try {
    assertSameOrigin(context.request);
    assertBodySize(context.request, MAX_BODY_BYTES);
    const gw = requireGateway(context.env);

    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new GatewayError(400, 'BAD_REQUEST', 'Message is required.');
    const messages = validMessages(body.messages);
    const intent = INTENTS.includes(body.intent as AiIntent) ? (body.intent as AiIntent) : 'chat';
    const temperature = clamp(body.temperature, 0, 2);
    const maxTokens = clamp(body.maxTokens, 1, MAX_TOKENS);

    const models = modelChain(gw, intent);
    const withImage = hasImage(messages);
    let lastStatus = 502;
    for (const model of models) {
      let res: Response;
      try {
        res = await fetch(`${gw.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(gw) },
          body: JSON.stringify({
            model,
            messages,
            ...(temperature !== undefined ? { temperature } : {}),
            ...(maxTokens !== undefined ? { max_tokens: Math.round(maxTokens) } : {}),
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        lastStatus = 502;
        continue;
      }
      if (!res.ok) {
        lastStatus = res.status;
        if (isRetryable(res.status)) continue;
        if (photoRefused(res.status, withImage)) {
          throw new GatewayError(400, 'UNSUPPORTED', "Photo questions aren't supported by the connected AI. This AI is text-only.");
        }
        throw upstreamError(res.status);
      }
      const data = (await res.json().catch(() => null)) as { choices?: Array<{ message?: { content?: unknown } }> } | null;
      const content = textOf(data?.choices?.[0]?.message?.content).trim();
      if (!content) {
        lastStatus = 502;
        continue;
      }
      return json({ content });
    }
    throw upstreamError(lastStatus);
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/ai/transcribe — voice input for browsers without built-in speech
 * recognition. Multipart body: file (audio), language? Reply: { text }.
 */

import {
  type AiContext,
  GatewayError,
  assertBodySize,
  assertSameOrigin,
  authHeaders,
  errorResponse,
  json,
  requireGateway,
  upstreamError,
} from './_gateway';

const MAX_BODY_BYTES = 25 * 1024 * 1024;

export async function onRequestPost(context: AiContext): Promise<Response> {
  try {
    assertSameOrigin(context.request);
    assertBodySize(context.request, MAX_BODY_BYTES);
    const gw = requireGateway(context.env);
    if (!gw.audio) throw new GatewayError(503, 'NOT_CONFIGURED', 'Voice transcription is not available yet.');

    const incoming = await context.request.formData().catch(() => null);
    const file = incoming?.get('file');
    if (!file || typeof file === 'string') throw new GatewayError(400, 'BAD_REQUEST', 'Recording is missing.');

    const form = new FormData();
    form.append('file', file, file.name || 'audio.webm');
    form.append('model', gw.audio);
    form.append('response_format', 'json');
    const language = incoming?.get('language');
    if (typeof language === 'string' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(language)) form.append('language', language);

    let res: Response;
    try {
      res = await fetch(`${gw.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: authHeaders(gw),
        body: form,
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      throw upstreamError(502);
    }
    if (!res.ok) throw upstreamError(res.status);
    const data = (await res.json().catch(() => ({}))) as { text?: unknown };
    const text = String(data.text ?? '').trim();
    if (!text) throw new GatewayError(502, 'EMPTY', 'No speech was recognised. Please try again.');
    return json({ text });
  } catch (err) {
    return errorResponse(err);
  }
}

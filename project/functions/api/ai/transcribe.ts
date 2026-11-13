/**
 * POST /api/ai/transcribe — voice input for browsers without built-in speech
 * recognition, with the owner's AI (AI_BASE_URL + AI_AUDIO_MODEL). Off while
 * AI_AUDIO_MODEL is blank. Multipart body: file (audio), language? Reply: { text }.
 */

import {
  type AiContext,
  GatewayError,
  authHeaders,
  errorResponse,
  json,
  requireGateway,
  upstreamError,
} from './_gateway';

const TIMEOUT_MS = 60_000;

export async function onRequestPost(context: AiContext): Promise<Response> {
  try {
    const gw = requireGateway(context.env);
    if (!gw.audio) throw new GatewayError(503, 'NOT_CONFIGURED', 'Voice transcription is not available yet.');

    const incoming = await context.request.formData().catch(() => null);
    const file = incoming?.get('file');
    if (!file || typeof file === 'string') throw new GatewayError(400, 'BAD_REQUEST', 'Recording is missing.');

    const form = new FormData();
    form.append('file', file, file.name || 'audio.webm');
    form.append('model', gw.audio);
    form.append('response_format', 'json');
    // Primary language subtag only ("en" from "en-US") — what transcription APIs expect.
    const language = incoming?.get('language');
    const lang = typeof language === 'string' ? language.split('-')[0].toLowerCase() : '';
    if (/^[a-z]{2,3}$/.test(lang)) form.append('language', lang);

    let res: Response;
    try {
      res = await fetch(`${gw.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: authHeaders(gw),
        body: form,
        signal: AbortSignal.timeout(TIMEOUT_MS),
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

/**
 * POST /api/ai/image — create an image, or edit an uploaded photo.
 *
 * Body: { prompt, image?: data URL } — with `image` the photo is edited in place.
 * Reply: { image: data URL or https URL }
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

const MAX_BODY_BYTES = 12 * 1024 * 1024;

type ImageReply = { data?: Array<{ b64_json?: string; url?: string }> };

function photoBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is);
  if (!match) throw new GatewayError(400, 'BAD_REQUEST', 'Please upload a JPG, PNG or WebP photo.');
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: match[1] });
}

export async function onRequestPost(context: AiContext): Promise<Response> {
  try {
    assertSameOrigin(context.request);
    assertBodySize(context.request, MAX_BODY_BYTES);
    const gw = requireGateway(context.env);
    if (!gw.image) throw new GatewayError(503, 'NOT_CONFIGURED', 'Image creation is not available yet.');

    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 4000) : '';
    if (!prompt) throw new GatewayError(400, 'BAD_REQUEST', 'Describe the image you want.');
    const photo = typeof body?.image === 'string' ? body.image : '';

    let res: Response;
    try {
      if (photo) {
        const blob = photoBlob(photo);
        const form = new FormData();
        form.append('image', blob, `photo.${blob.type.split('/')[1] || 'png'}`);
        form.append('prompt', prompt);
        form.append('n', '1');
        form.append('size', '1024x1024');
        form.append('response_format', 'b64_json');
        form.append('model', gw.image);
        res = await fetch(`${gw.baseUrl}/images/edits`, {
          method: 'POST',
          headers: authHeaders(gw),
          body: form,
          signal: AbortSignal.timeout(120_000),
        });
      } else {
        res = await fetch(`${gw.baseUrl}/images/generations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(gw) },
          body: JSON.stringify({ model: gw.image, prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
          signal: AbortSignal.timeout(120_000),
        });
      }
    } catch (err) {
      if (err instanceof GatewayError) throw err;
      throw upstreamError(502);
    }
    if (!res.ok) throw upstreamError(res.status);
    const item = ((await res.json().catch(() => ({}))) as ImageReply).data?.[0];
    if (item?.b64_json) return json({ image: `data:image/png;base64,${item.b64_json}` });
    if (item?.url) return json({ image: item.url });
    throw new GatewayError(502, 'EMPTY', 'SG16 AI could not produce an image. Please try again.');
  } catch (err) {
    return errorResponse(err);
  }
}

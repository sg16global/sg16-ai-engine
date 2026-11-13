/**
 * GET /api/ai/status — whether the owner's AI is connected, for the status bar.
 * A boolean only: never the endpoint, key or model name.
 */

import { type AiContext, gateway, json } from './_gateway';

export async function onRequestGet(context: AiContext): Promise<Response> {
  return json({ configured: Boolean(gateway(context.env)) });
}

/**
 * GET /api/ai/status — what the engine can do, for the status bar.
 * Booleans only: never the base URL, key or model names.
 */

import { type AiContext, gateway, json } from './_gateway';

export async function onRequestGet(context: AiContext): Promise<Response> {
  const gw = gateway(context.env);
  return json({
    configured: Boolean(gw),
    vision: Boolean(gw?.vision),
    audio: Boolean(gw?.audio),
    image: Boolean(gw?.image),
  });
}

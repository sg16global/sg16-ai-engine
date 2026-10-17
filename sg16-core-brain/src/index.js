/**
 * SG16 Core Brain — Cloudflare Worker.
 *
 * SG16 contract (used by the SG16 AI Engine backend, SG16_BRAIN=mistralbrain):
 *   GET  /api/v1/ping                 health, no key
 *   POST /api/v1/control              { task, user_text }        → { status, answer, model, provider, math }
 *   POST /api/v1/vision               { prompt, image_base64 }   → { status, answer, model }
 *   POST /api/v1/math                 { input }                  → { status, kind, input, result }
 *
 * OpenAI-compatible (any app, SDK or tool can connect):
 *   GET  /v1/models
 *   POST /v1/chat/completions         { messages, max_tokens?, temperature?, stream? }
 *
 * Keys: X-Door-Key: <key>  or  Authorization: Bearer <key>  (CORE_API_KEYS secret, comma-separated).
 */
import { BrainUnavailableError, think } from './brain.js';
import { solveMath } from './mathCore.js';
import { coreModels, extraProviders, runVision } from './providers.js';

const ENGINE = 'SG16 Core Brain';
const PUBLIC_MODEL_ID = 'sg16-core';
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MAX_TOKENS_LIMIT = 4096;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function error(message, status, extra = {}) {
  return json({ status: 'error', error: message, ...extra }, status);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Returns an error Response when the request is not authorised, otherwise null. */
function checkKey(request, env) {
  const keys = (env.CORE_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  if (keys.length === 0) return error('Brain keys are not configured (set the CORE_API_KEYS secret)', 503);

  const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  const supplied = (request.headers.get('X-Door-Key') || bearer || '').trim();
  if (!supplied || !keys.some((k) => timingSafeEqual(k, supplied))) {
    return error('Invalid or missing brain key', 401);
  }
  return null;
}

async function readJson(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) throw Object.assign(new Error('Request body too large'), { status: 413 });
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') throw new Error('not an object');
    return body;
  } catch {
    throw Object.assign(new Error('Request body must be a JSON object'), { status: 400 });
  }
}

function clampTokens(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), MAX_TOKENS_LIMIT) : fallback;
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw Object.assign(new Error('"messages" must be a non-empty array'), { status: 400 });
  }
  return raw
    .filter((m) => m && ['system', 'user', 'assistant'].includes(m.role))
    .map((m) => ({
      role: m.role,
      content: Array.isArray(m.content)
        ? m.content.filter((p) => p?.type === 'text').map((p) => p.text).join('\n')
        : String(m.content ?? ''),
    }));
}

function base64ToBytes(b64) {
  const clean = String(b64).replace(/^data:[^,]*,/, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------- handlers

function handlePing(env) {
  return json({
    status: 'ok',
    engine: ENGINE,
    models: coreModels(env),
    mathCore: true,
    addonApis: extraProviders(env).map((p) => p.name || 'api'),
    time: new Date().toISOString(),
  });
}

async function handleControl(request, env) {
  const body = await readJson(request);
  const task = typeof body.task === 'string' ? body.task.slice(0, 40_000) : '';
  if (!task.trim()) return error('"task" is required', 400);
  const userText = typeof body.user_text === 'string' ? body.user_text : undefined;

  const result = await think(env, {
    messages: [{ role: 'user', content: task }],
    userText,
    maxTokens: clampTokens(body.max_tokens, 1024),
  });
  return json({ status: 'ok', ...result });
}

async function handleVision(request, env) {
  const body = await readJson(request);
  if (!body.image_base64) return error('"image_base64" is required', 400);
  let bytes;
  try {
    bytes = base64ToBytes(body.image_base64);
  } catch {
    return error('"image_base64" is not valid base64', 400);
  }
  const prompt = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.slice(0, 8000) : 'Describe this image.';
  try {
    const { text, model } = await runVision(env, prompt, bytes);
    return json({ status: 'ok', answer: text, model, provider: 'sg16-core' });
  } catch (err) {
    return error(`SG16 vision could not read this image: ${err?.message || err}`, 503);
  }
}

async function handleMath(request) {
  const body = await readJson(request);
  const input = typeof body.input === 'string' ? body.input : typeof body.expression === 'string' ? body.expression : '';
  if (!input.trim()) return error('"input" is required', 400);
  const result = solveMath(input);
  if (!result) return error('SG16 Math Core could not compute this input', 422);
  return json({ status: 'ok', ...result });
}

function handleModels() {
  return json({
    object: 'list',
    data: [{ id: PUBLIC_MODEL_ID, object: 'model', created: 0, owned_by: 'sg16' }],
  });
}

function sseResponse(id, created, answer) {
  const chunk = (delta, finish) =>
    `data: ${JSON.stringify({
      id,
      object: 'chat.completion.chunk',
      created,
      model: PUBLIC_MODEL_ID,
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`;
  const body = chunk({ role: 'assistant', content: answer }, null) + chunk({}, 'stop') + 'data: [DONE]\n\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' },
  });
}

async function handleChatCompletions(request, env) {
  const body = await readJson(request);
  const messages = sanitizeMessages(body.messages);
  const temperature = Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.6;
  const result = await think(env, {
    messages,
    maxTokens: clampTokens(body.max_tokens ?? body.max_completion_tokens, 1024),
    temperature,
  });

  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  if (body.stream === true) return sseResponse(id, created, result.answer);

  return json({
    id,
    object: 'chat.completion',
    created,
    model: PUBLIC_MODEL_ID,
    choices: [{ index: 0, message: { role: 'assistant', content: result.answer }, finish_reason: 'stop' }],
    sg16: { provider: result.provider, model: result.model, math: result.math },
  });
}

// ---------------------------------------------------------------- router

const ROUTES = {
  'POST /api/v1/control': handleControl,
  'POST /api/v1/vision': handleVision,
  'POST /api/v1/math': handleMath,
  'GET /v1/models': handleModels,
  'POST /v1/chat/completions': handleChatCompletions,
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const path = pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'GET' && ['/', '/health', '/api/v1/ping'].includes(path)) {
      return handlePing(env);
    }

    const handler = ROUTES[`${request.method} ${path}`];
    if (!handler) return error('Not found', 404);

    const denied = checkKey(request, env);
    if (denied) return denied;

    try {
      return await handler(request, env);
    } catch (err) {
      if (err instanceof BrainUnavailableError) {
        console.error('[sg16-core] all models failed', JSON.stringify(err.failures));
        return error(err.message, 503, { failures: err.failures.map((f) => `${f.provider}: ${f.error}`) });
      }
      if (err?.status) return error(err.message, err.status);
      console.error('[sg16-core]', err);
      return error('SG16 Core Brain internal error', 500);
    }
  },
};

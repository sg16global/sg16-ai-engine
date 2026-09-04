/**
 * SG16 Mistral X — Cloud Brain client (api.mistralbrain.com)
 * 24/7 Cloudflare Workers AI — no local Ollama required.
 */

function getBrainUrl() {
  return (process.env.MISTRAL_BRAIN_URL || 'https://api.mistralbrain.com').replace(/\/$/, '');
}

function getBrainKey() {
  return (
    process.env.MISTRAL_BRAIN_KEY ||
    process.env.DOOR_API_KEY ||
    process.env.SG16_MISTRAL_BRAIN_KEY ||
    ''
  ).trim();
}

export function isMistralBrainCloud() {
  const mode = process.env.SG16_BRAIN?.trim().toLowerCase();
  return mode === 'mistralbrain' || mode === 'cloud' || mode === 'mistral-x';
}

export function isMistralBrainConfigured() {
  return isMistralBrainCloud() && !!getBrainKey();
}

function messagesToTask(messages) {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const recent = messages
    .filter((m) => m.role !== 'system')
    .slice(-8)
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n');
  let task = '';
  if (systemParts) task += `System context:\n${systemParts}\n\n`;
  task += `Conversation:\n${recent}\n\nReply as the assistant. Be helpful and concise.`;
  return task.slice(0, 10000);
}

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user' && messages[i].content) {
      return String(messages[i].content).slice(0, 2000);
    }
  }
  return '';
}

export async function pingMistralBrain() {
  const url = `${getBrainUrl()}/api/v1/ping`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Brain ping failed: ${res.status}`);
  return res.json();
}

export async function callMistralBrainChat({
  messages,
  userId = 'sg16-ai-engine',
  timeoutMs = 120000,
}) {
  const key = getBrainKey();
  if (!key) throw new Error('MISTRAL_BRAIN_KEY not configured');

  const task = messagesToTask(messages);
  const url = `${getBrainUrl()}/api/v1/control`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Door-Key': key,
      'X-User-Id': userId,
    },
    body: JSON.stringify({ task, max_steps: 1, user_text: lastUserText(messages) }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const err = new Error('Mistral Brain returned invalid JSON');
    err.status = res.status;
    err.provider = 'mistralbrain';
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error || data.answer || 'Mistral Brain request failed');
    err.status = res.status;
    err.provider = 'mistralbrain';
    throw err;
  }

  const content = data.answer?.trim();
  if (!content) throw new Error('Mistral Brain returned empty response');
  return content;
}

export async function probeMistralBrain() {
  const started = Date.now();
  try {
    await pingMistralBrain();
    const reply = await callMistralBrainChat({
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      timeoutMs: Number(process.env.MISTRAL_BRAIN_PROBE_MS || 60000),
    });
    return {
      ok: true,
      latencyMs: Date.now() - started,
      url: getBrainUrl(),
      sample: reply.slice(0, 40),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      url: getBrainUrl(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function extractVisionPayload(messages) {
  let system = '';
  let prompt = '';
  let imageUrl = null;

  for (const msg of messages || []) {
    if (msg.role === 'system' && typeof msg.content === 'string') {
      system = msg.content;
    }
    if (msg.role === 'user') {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part?.type === 'text') prompt = part.text;
          if (part?.type === 'image_url') imageUrl = part.image_url?.url;
        }
      } else if (typeof msg.content === 'string') {
        prompt = msg.content;
      }
    }
  }

  return {
    prompt: (system ? `${system}\n\n` : '') + (prompt || 'Describe this image.'),
    imageUrl,
  };
}

async function imageUrlToBase64(imageUrl) {
  if (!imageUrl) throw new Error('No image provided');
  if (imageUrl.startsWith('data:')) {
    const b64 = imageUrl.split(',')[1];
    if (!b64) throw new Error('Invalid image data URL');
    return b64;
  }
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}

/** SG16 Mistral X vision — Cloudflare Workers AI via api.mistralbrain.com (no Groq). */
export async function callMistralBrainVision({
  messages,
  userId = 'sg16-ai-engine',
  timeoutMs = 120000,
}) {
  const key = getBrainKey();
  if (!key) throw new Error('MISTRAL_BRAIN_KEY not configured');

  const { prompt, imageUrl } = extractVisionPayload(messages);
  const image_base64 = await imageUrlToBase64(imageUrl);
  const url = `${getBrainUrl()}/api/v1/vision`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Door-Key': key,
      'X-User-Id': userId,
    },
    body: JSON.stringify({ prompt: prompt.slice(0, 8000), image_base64 }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Mistral Brain vision returned invalid JSON');
  }

  if (!res.ok) {
    throw new Error(data.error || data.answer || 'Mistral Brain vision request failed');
  }

  const content = data.answer?.trim();
  if (!content) throw new Error('Mistral Brain vision returned empty response');
  return content;
}

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
    body: JSON.stringify({ task, max_steps: 1 }),
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

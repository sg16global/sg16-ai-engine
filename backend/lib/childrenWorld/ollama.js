function getOllamaBaseUrl() {
  return (process.env.OLLAMA_URL || process.env.SG16_OLLAMA_URL || 'http://127.0.0.1:11434').replace(
    /\/$/,
    '',
  );
}

function getOllamaModel() {
  return (
    process.env.SG16_OLLAMA_MODEL ||
    process.env.SG16_AI_MODEL_TEXT ||
    'mistral:7b-instruct'
  ).trim();
}

function ollamaOptions(maxTokens) {
  return {
    num_ctx: Number(process.env.OLLAMA_NUM_CTX || 2048),
    num_predict: maxTokens,
    num_thread: Number(process.env.OLLAMA_NUM_THREAD || 4),
    temperature: 0.5,
  };
}

export async function pingOllama() {
  const started = Date.now();
  try {
    const res = await fetch(`${getOllamaBaseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, latencyMs: Date.now() - started, error: `tags HTTP ${res.status}` };
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    const model = getOllamaModel();
    const ready = models.some(
      (name) => name === model || name.startsWith(`${model.split(':')[0]}:`),
    );
    return { ok: true, latencyMs: Date.now() - started, models, model, ready };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - started, error: err.message };
  }
}

export async function chatOllamaNative({
  messages,
  maxTokens = 120,
  timeoutMs = 120000,
}) {
  const model = getOllamaModel();
  const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: ollamaOptions(maxTokens),
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '24h',
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Ollama chat HTTP ${res.status}`);
  }

  const content = data.message?.content?.trim();
  if (!content) throw new Error('Ollama returned empty response');
  return content;
}

export async function streamOllamaNative({
  messages,
  onToken,
  maxTokens = 120,
  timeoutMs = 120000,
}) {
  const model = getOllamaModel();
  const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: ollamaOptions(maxTokens),
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '24h',
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(detail || 'Ollama stream failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Ollama stream unavailable');

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        const delta = json.message?.content;
        if (!delta) continue;
        content += delta;
        onToken?.(delta, content);
      } catch {
        // ignore malformed chunks
      }
    }
  }

  return content.trim();
}

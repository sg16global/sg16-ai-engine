const DEFAULT_MODEL = process.env.SG16_GEMINI_MODEL || 'gemini-2.0-flash';
const DOC_MIN_CHARS = Number(process.env.SG16_DOC_GEMINI_MIN_CHARS || 8000);

function cleanKey(key) {
  const k = key?.trim();
  if (!k || k.startsWith('<your_')) return null;
  return k;
}

export function getGeminiApiKey() {
  return (
    cleanKey(process.env.SG16_GEMINI_API_KEY) ||
    cleanKey(process.env.GEMINI_API_KEY) ||
    cleanKey(process.env.GOOGLE_AI_API_KEY)
  );
}

export function hasGeminiKey() {
  return Boolean(getGeminiApiKey());
}

export function getGeminiModel() {
  return process.env.SG16_GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

/** Prefer Gemini for Document Lab when key exists or message is large. */
export function shouldUseGeminiForDocument(workspaceId, message) {
  if (workspaceId !== 'document') return false;
  if (!hasGeminiKey()) return false;
  return message.length >= DOC_MIN_CHARS || process.env.SG16_DOC_GEMINI_ALWAYS === '1';
}

export function shouldPreferGeminiForDocument(workspaceId) {
  return workspaceId === 'document' && hasGeminiKey();
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    return { mimeType: 'image/jpeg', data: b64 };
  }
  return { mimeType: match[1], data: match[2] };
}

function toGeminiContents(messages) {
  const contents = [];
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts = [];

    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') parts.push({ text: part.text });
        if (part.type === 'image_url') {
          const { mimeType, data } = parseDataUrl(part.image_url.url);
          parts.push({ inline_data: { mime_type: mimeType, data } });
        }
      }
    } else {
      parts.push({ text: String(msg.content) });
    }

    if (parts.length) contents.push({ role, parts });
  }
  return contents;
}

function getSystemInstruction(messages) {
  const system = messages.find((m) => m.role === 'system');
  if (!system) return undefined;
  const text = typeof system.content === 'string' ? system.content : '';
  return text ? { parts: [{ text }] } : undefined;
}

async function callGeminiApi({ messages, temperature = 0.5, maxTokens = 4096, timeoutMs = 120000 }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('SG16 document analysis is not configured');

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const systemInstruction = getSystemInstruction(messages);
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'SG16 document analysis failed');
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('').trim();
  if (!text) throw new Error('SG16 AI returned an empty document response');
  return text;
}

export async function callGeminiChat({ messages, temperature, maxTokens }) {
  const content = await callGeminiApi({ messages, temperature, maxTokens });
  return { content, model: getGeminiModel(), provider: 'gemini' };
}

export async function callGeminiVision({ system, userText, imageUrl, temperature = 0.1 }) {
  const messages = [
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
  const content = await callGeminiApi({ messages, temperature, maxTokens: 2048 });
  return content;
}

const IMAGE_MODEL = process.env.SG16_IMAGE_MODEL || 'gpt-image-1';
const KONTEXT_MODEL = process.env.SG16_KONTEXT_MODEL || 'flux-kontext-pro';

function getOpenAiImageKey() {
  return (process.env.SG16_IMAGE_API_KEY || process.env.OPENAI_API_KEY)?.trim();
}

function getBflKey() {
  return (process.env.SG16_BFL_API_KEY || process.env.BFL_API_KEY)?.trim();
}

function getReplicateKey() {
  return (process.env.SG16_REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN)?.trim();
}

function getPollKey() {
  return (process.env.SG16_POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_KEY)?.trim();
}

function isBalanceError(message) {
  return /insufficient balance|payment required|402|budget exhausted|pollen/i.test(message);
}

function userFacingEditError(errors) {
  const text = errors.join(' ');
  if (isBalanceError(text)) {
    return 'SG16 AI photo editing credits are too low for this edit. Please add credits at enter.pollinations.ai (edits need about 0.04 pollen each), then try again.';
  }
  return 'SG16 AI could not edit this photo while preserving the original. Please try: "Remove the object, keep the face exactly the same."';
}

export function hasImageApiKey() {
  return hasKey(getOpenAiImageKey());
}

export function hasAnyEditProviderKey() {
  return hasImageApiKey() || hasKey(getBflKey()) || hasKey(getReplicateKey()) || hasKey(getPollKey());
}

function hasKey(key) {
  return Boolean(key && !key.startsWith('<your_'));
}

const EDIT_PATTERN =
  /remove|erase|delete|watermark|edit|fix|retouch|enhance|clean|strip|eliminate|without|change|replace|modify|adjust|inpaint|touch up|make the|make it|convert to|add a|add an|keep|object|person|face|background/i;

const ANALYZE_PATTERN =
  /^(what|describe|identify|read|extract|ocr|analyze|explain|tell me|caption|how many|where is|who is|list)/i;

export function getImageAction(message, hasImage) {
  const text = message.trim();
  if (!hasImage) return 'generate';

  const lower = text.toLowerCase();
  if (EDIT_PATTERN.test(lower)) return 'edit';
  if (ANALYZE_PATTERN.test(lower) || text.endsWith('?')) return 'analyze';
  return 'edit';
}

function dataUrlToBuffer(dataUrl) {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Buffer.from(b64, 'base64');
}

function mimeFromDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] || 'image/png';
}

function toBase64Payload(dataUrl) {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

function extractB64Image(data) {
  const item = data.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  throw new Error('SG16 AI could not produce an image. Please try a different prompt.');
}

function buildPreserveEditPrompt(userMessage) {
  return `${userMessage}

CRITICAL — preserve the original photograph:
- Keep every person's face, facial features, skin tone, expression, eyes, hair, and identity EXACTLY the same.
- Keep body pose, clothing, hands, and proportions identical unless explicitly asked to change them.
- Keep background, lighting, camera angle, and overall composition the same unless explicitly asked to change them.
- ONLY make the specific change requested. Do NOT redraw, reimagine, or generate a new scene.
- This must be a photorealistic in-place edit of the original photo.`;
}

async function urlToDataUrl(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error('SG16 AI failed to retrieve the edited image.');
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function pollinationsGenerate(prompt) {
  const encoded = encodeURIComponent(prompt.slice(0, 2000));
  const res = await fetch(
    `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`,
    { signal: AbortSignal.timeout(120000) },
  );
  if (!res.ok) throw new Error('SG16 AI image creation failed. Please try again.');
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function openaiGenerate(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenAiImageKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: '1024x1024',
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'SG16 AI image creation failed.');
  }
  return extractB64Image(data);
}

async function openaiEdit(imageDataUrl, userMessage) {
  const buffer = dataUrlToBuffer(imageDataUrl);
  const mime = mimeFromDataUrl(imageDataUrl);
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const prompt = buildPreserveEditPrompt(userMessage);

  const form = new FormData();
  form.append('model', IMAGE_MODEL);
  form.append('prompt', prompt.slice(0, 4000));
  form.append('image', new Blob([buffer], { type: mime }), `image.${ext}`);
  form.append('size', 'auto');
  form.append('input_fidelity', 'high');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getOpenAiImageKey()}` },
    body: form,
    signal: AbortSignal.timeout(180000),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'SG16 AI image editing failed.');
  }
  return extractB64Image(data);
}

async function bflKontextEdit(imageDataUrl, userMessage) {
  const key = getBflKey();
  const prompt = buildPreserveEditPrompt(userMessage);
  const input_image = toBase64Payload(imageDataUrl);

  const createRes = await fetch(`https://api.bfl.ai/v1/${KONTEXT_MODEL}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, input_image }),
    signal: AbortSignal.timeout(30000),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData.message || createData.error || 'SG16 AI image editing failed.');
  }

  const requestId = createData.id;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.bfl.ai/v1/get_result?id=${requestId}`, {
      headers: { accept: 'application/json', 'x-key': key },
      signal: AbortSignal.timeout(15000),
    });
    const pollData = await pollRes.json();
    if (pollData.status === 'Ready' && pollData.result?.sample) {
      return urlToDataUrl(pollData.result.sample);
    }
    if (pollData.status === 'Error' || pollData.status === 'Failed') {
      throw new Error(pollData.error || 'SG16 AI image editing failed.');
    }
  }
  throw new Error('SG16 AI image editing timed out. Please try again.');
}

async function replicateKontextEdit(imageDataUrl, userMessage) {
  const key = getReplicateKey();
  const prompt = buildPreserveEditPrompt(userMessage);

  const res = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=180',
      },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: imageDataUrl,
          output_format: 'png',
        },
      }),
      signal: AbortSignal.timeout(190000),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'SG16 AI image editing failed.');
  }
  if (data.status === 'failed') {
    throw new Error(data.error || 'SG16 AI image editing failed.');
  }

  const output = data.output;
  const url = Array.isArray(output) ? output[0] : output;
  if (!url) throw new Error('SG16 AI did not return an edited image.');
  return urlToDataUrl(url);
}

async function pollinationsEditWithModel(imageDataUrl, userMessage, model) {
  const buffer = dataUrlToBuffer(imageDataUrl);
  const mime = mimeFromDataUrl(imageDataUrl);
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const prompt = buildPreserveEditPrompt(userMessage);
  const pollKey = getPollKey();

  const form = new FormData();
  form.append('image', new Blob([buffer], { type: mime }), `photo.${ext}`);
  form.append('prompt', prompt.slice(0, 4000));
  form.append('model', model);
  form.append('response_format', 'b64_json');

  const res = await fetch('https://gen.pollinations.ai/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pollKey}` },
    body: form,
    signal: AbortSignal.timeout(180000),
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('image/')) {
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType.split(';')[0]};base64,${buf.toString('base64')}`;
  }

  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || data.message || data.error || JSON.stringify(data);
    throw new Error(msg);
  }

  const b64 = data.data?.[0]?.b64_json || data.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  if (data.data?.[0]?.url) return urlToDataUrl(data.data[0].url);
  if (typeof data.url === 'string') return urlToDataUrl(data.url);
  throw new Error('SG16 AI did not return an edited photo.');
}

async function pollinationsEdit(imageDataUrl, userMessage) {
  const models = ['p-image-edit', 'klein', 'flux', 'zimage', 'seedream', 'kontext'];
  const errors = [];

  for (const model of models) {
    try {
      return await pollinationsEditWithModel(imageDataUrl, userMessage, model);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model}: ${msg}`);
      console.warn(`SG16 Pollinations ${model} failed:`, msg);
      if (!isBalanceError(msg) && !/model|unsupported|not found|invalid/i.test(msg)) {
        break;
      }
    }
  }

  throw new Error(userFacingEditError(errors));
}

async function editImagePreserveOriginal(imageDataUrl, userMessage) {
  const errors = [];

  if (hasKey(getPollKey())) {
    try {
      return await pollinationsEdit(imageDataUrl, userMessage);
    } catch (err) {
      errors.push(`pollinations: ${err.message}`);
      console.warn('SG16 Pollinations edit failed:', err.message);
      if (isBalanceError(err.message)) {
        throw err;
      }
    }
  }

  if (hasImageApiKey()) {
    try {
      return await openaiEdit(imageDataUrl, userMessage);
    } catch (err) {
      errors.push(`openai: ${err.message}`);
      console.warn('SG16 OpenAI edit failed:', err.message);
    }
  }

  if (hasKey(getBflKey())) {
    try {
      return await bflKontextEdit(imageDataUrl, userMessage);
    } catch (err) {
      errors.push(`bfl: ${err.message}`);
      console.warn('SG16 BFL edit failed:', err.message);
    }
  }

  if (hasKey(getReplicateKey())) {
    try {
      return await replicateKontextEdit(imageDataUrl, userMessage);
    } catch (err) {
      errors.push(`replicate: ${err.message}`);
      console.warn('SG16 Replicate edit failed:', err.message);
    }
  }

  if (!hasAnyEditProviderKey()) {
    throw new Error(
      'SG16 AI photo editing is not enabled yet. Add SG16_POLLINATIONS_API_KEY or SG16_IMAGE_API_KEY to the server configuration.',
    );
  }

  throw new Error(userFacingEditError(errors));
}

export async function createOrEditImage({ message, imageUrl }) {
  const action = getImageAction(message, !!imageUrl);

  if (action === 'generate') {
    const generatedImageUrl = hasImageApiKey()
      ? await openaiGenerate(message)
      : await pollinationsGenerate(message);
    return {
      reply: 'Here is your image, created by SG16 AI:',
      generatedImageUrl,
    };
  }

  if (action === 'edit') {
    if (!imageUrl) {
      throw new Error('Please upload your photo first, then describe exactly what to remove or change.');
    }
    const generatedImageUrl = await editImagePreserveOriginal(imageUrl, message);
    return {
      reply: 'Here is your edited photo from SG16 AI — original faces and details preserved:',
      generatedImageUrl,
    };
  }

  return null;
}

export { pollinationsGenerate };

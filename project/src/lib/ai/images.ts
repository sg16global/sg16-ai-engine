import { useAiConfigStore } from '../../core/aiConfigStore';
import { getAdapter } from './adapters';
import { providerChain } from './config';
import type { AiProviderConfig } from './types';

/**
 * Image workspace — create and edit images from the browser.
 *
 * - A connected provider with an image model (e.g. OpenAI gpt-image-1, or a
 *   Pollinations key on a custom `https://gen.pollinations.ai/v1` endpoint)
 *   does the work through its adapter.
 * - Generation always has a keyless fallback: Pollinations' public endpoint.
 * - Ported from the old server (backend/lib/imageEngine.js).
 */

const EDIT_PATTERN =
  /remove|erase|delete|watermark|edit|fix|retouch|enhance|clean|strip|eliminate|without|change|replace|modify|adjust|inpaint|touch up|make the|make it|convert to|add a|add an|keep|object|person|face|background/i;

const ANALYZE_PATTERN =
  /^(what|describe|identify|read|extract|ocr|analyze|explain|tell me|caption|how many|where is|who is|list)/i;

export type ImageAction = 'generate' | 'edit' | 'analyze';

export function getImageAction(message: string, hasImage: boolean): ImageAction {
  const text = message.trim();
  if (!hasImage) return 'generate';
  const lower = text.toLowerCase();
  if (EDIT_PATTERN.test(lower)) return 'edit';
  if (ANALYZE_PATTERN.test(lower) || text.endsWith('?')) return 'analyze';
  return 'analyze';
}

/* ── Provider with an image model ── */

function imageProvider(): { provider: AiProviderConfig; model: string } | null {
  const chain = providerChain(useAiConfigStore.getState().providers);
  for (const provider of chain) {
    if (!provider.baseUrl.trim()) continue;
    if (provider.requiresKey && !provider.apiKey.trim()) continue;
    const model = provider.models.image.trim();
    if (model) return { provider, model };
  }
  return null;
}

/* ── Generation ── */

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the generated image.'));
    reader.readAsDataURL(blob);
  });
}

/** Keyless fallback generator — public Pollinations endpoint, no key needed. */
async function pollinationsGenerate(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt.slice(0, 2000));
  const res = await fetch(
    `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`,
    { signal: AbortSignal.timeout(120_000) },
  );
  if (!res.ok) throw new Error('SG16 AI image creation failed. Please try again.');
  return blobToDataUrl(await res.blob());
}

async function generateWithProvider(prompt: string): Promise<string | null> {
  const found = imageProvider();
  if (!found) return null;
  const adapter = getAdapter(found.provider.adapter);
  if (!adapter.generateImage) return null;
  return adapter.generateImage(found.provider, prompt, found.model);
}

/** Create an image: connected provider first, keyless Pollinations as the fallback. */
export async function generateImage(prompt: string): Promise<string> {
  try {
    const viaProvider = await generateWithProvider(prompt);
    if (viaProvider) return viaProvider;
  } catch {
    /* provider failed — the keyless generator still answers */
  }
  return pollinationsGenerate(prompt);
}

/* ── Editing ── */

function buildPreserveEditPrompt(userMessage: string): string {
  return `${userMessage}

CRITICAL — preserve the original photograph:
- Keep every person's face, facial features, skin tone, expression, eyes, hair, and identity EXACTLY the same.
- Keep body pose, clothing, hands, and proportions identical unless explicitly asked to change them.
- Keep background, lighting, camera angle, and overall composition the same unless explicitly asked to change them.
- ONLY make the specific change requested. Do NOT redraw, reimagine, or generate a new scene.
- This must be a photorealistic in-place edit of the original photo.`;
}

/** Edit a photo in place. Needs a connected provider with an image model. */
export async function editImage(imageDataUrl: string, prompt: string): Promise<string> {
  const found = imageProvider();
  if (found) {
    const adapter = getAdapter(found.provider.adapter);
    if (adapter.editImage) {
      return adapter.editImage(found.provider, buildPreserveEditPrompt(prompt), imageDataUrl, found.model);
    }
  }
  throw new Error(
    'SG16 AI photo editing needs a connected provider with an image model (for example OpenAI gpt-image-1, or a Pollinations key on a custom endpoint). Open Admin to connect one.',
  );
}

/* ── Chat entry (Image workspace) ── */

/**
 * Image workspace action. Returns a chat result with the image, or null when
 * the message is an analysis question (the vision model answers that instead).
 */
export async function createOrEditImage({
  message,
  imageUrl,
}: {
  message: string;
  imageUrl?: string;
}): Promise<{ reply: string; generatedImageUrl: string } | null> {
  const action = getImageAction(message, Boolean(imageUrl));

  if (action === 'generate') {
    const generatedImageUrl = await generateImage(message);
    return { reply: 'Here is your image, created by SG16 AI:', generatedImageUrl };
  }

  if (action === 'edit') {
    if (!imageUrl) {
      throw new Error('Please upload your photo first, then describe exactly what to remove or change.');
    }
    const generatedImageUrl = await editImage(imageUrl, message);
    return {
      reply: 'Here is your edited photo from SG16 AI — original faces and details preserved:',
      generatedImageUrl,
    };
  }

  return null;
}

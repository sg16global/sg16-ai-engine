import { useAiConfigStore } from '../../core/aiConfigStore';
import { providerChain } from './config';
import { wireEditImage, wireGenerateImage } from './wire';
import type { AiProviderConfig } from './types';

/**
 * Image workspace — create and edit images from the browser.
 *
 * A connected endpoint with an image model does the work through the
 * standard protocol (wire.ts). There is no built-in third-party generator:
 * image creation needs an endpoint with an image model configured in Admin.
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

/* ── Endpoint with an image model ── */

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

/** Create an image with the connected endpoint's image model. */
export async function generateImage(prompt: string): Promise<string> {
  const found = imageProvider();
  if (!found) {
    throw new Error(
      'Image creation needs a connected endpoint with an image model. Open Admin and set one in the "Image model" field.',
    );
  }
  return wireGenerateImage(found.provider, prompt, found.model);
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

/** Edit a photo in place. Needs a connected endpoint with an image model. */
export async function editImage(imageDataUrl: string, prompt: string): Promise<string> {
  const found = imageProvider();
  if (!found) {
    throw new Error(
      'Photo editing needs a connected endpoint with an image model. Open Admin and set one in the "Image model" field.',
    );
  }
  return wireEditImage(found.provider, buildPreserveEditPrompt(prompt), imageDataUrl, found.model);
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

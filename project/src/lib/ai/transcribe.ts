import { useAiConfigStore } from '../../core/aiConfigStore';
import { providerChain } from './config';
import { wireTranscribe } from './wire';

/**
 * Voice transcription — the browser records audio, a connected endpoint with
 * an audio model transcribes it via the standard protocol (wire.ts). Browsers
 * with built-in speech recognition (Web Speech API) never reach this — see
 * lib/voiceInput.ts.
 */

export async function transcribeAudio(blob: Blob, mimeType: string, language?: string): Promise<string> {
  if (blob.size < 256) {
    throw new Error('Recording too short. Tap mic, speak, then tap again.');
  }

  const chain = providerChain(useAiConfigStore.getState().providers);
  const errors: string[] = [];

  for (const provider of chain) {
    const model = provider.models.audio.trim();
    if (!model) continue;
    if (!provider.baseUrl.trim()) continue;
    if (provider.requiresKey && !provider.apiKey.trim()) continue;
    try {
      return await wireTranscribe(provider, blob, mimeType, model, language);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    errors.length
      ? `Voice transcription failed: ${errors[0]}`
      : 'Voice transcription needs a connected endpoint with an audio model. Set one in Admin — or use a browser with built-in speech recognition.',
  );
}

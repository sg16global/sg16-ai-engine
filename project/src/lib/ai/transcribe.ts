import { useAiConfigStore } from '../../core/aiConfigStore';
import { getAdapter } from './adapters';
import { providerChain } from './config';

/**
 * Voice transcription — the browser records audio, a connected provider with
 * an audio model (e.g. Whisper) transcribes it. Browsers with built-in speech
 * recognition (Web Speech API) never reach this — see lib/voiceInput.ts.
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
    const adapter = getAdapter(provider.adapter);
    if (!adapter.transcribe) continue;
    try {
      return await adapter.transcribe(provider, blob, mimeType, model, language);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    errors.length
      ? `Voice transcription failed: ${errors[0]}`
      : 'Voice transcription needs a provider with an audio model (e.g. Whisper). Connect one in Admin — or use a browser with built-in speech recognition.',
  );
}

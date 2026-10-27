import { wireTranscribe } from './wire';

/**
 * Voice transcription — the browser records audio and SG16's backend
 * transcribes it (/api/ai/transcribe, wire.ts). Browsers with built-in speech
 * recognition (Web Speech API) never reach this — see lib/voiceInput.ts.
 */

export async function transcribeAudio(blob: Blob, mimeType: string, language?: string): Promise<string> {
  if (blob.size < 256) {
    throw new Error('Recording too short. Tap mic, speak, then tap again.');
  }
  try {
    return await wireTranscribe(blob, mimeType, language);
  } catch (err) {
    throw new Error(`Voice transcription failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

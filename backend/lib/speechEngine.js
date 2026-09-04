/** Voice input — browser Web Speech API only. 100% own brain policy: no Groq Whisper. */

export function speechTranscriptionAvailable() {
  return true;
}

export async function transcribeAudio() {
  throw new Error(
    'SG16 uses browser voice input only (Web Speech API). No third-party speech API on the server.',
  );
}

export async function handleSpeechTranscribe(_req, res) {
  return res.status(501).json({
    error:
      'Server-side transcription is disabled. SG16 uses 100% own brain — use your browser microphone (Web Speech API).',
    useBrowserSpeech: true,
    brain: 'mistralbrain-cloud',
  });
}

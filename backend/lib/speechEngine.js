function cleanKey(key) {
  const k = key?.trim();
  if (!k || k.startsWith('<your_')) return null;
  return k;
}

function getGroqKey() {
  return cleanKey(process.env.SG16_AI_API_KEY) || cleanKey(process.env.SG16_ROUTER_API_KEY);
}

export function speechTranscriptionAvailable() {
  return Boolean(getGroqKey());
}

/**
 * Transcribe audio buffer via Groq Whisper (works for iPhone / all browsers).
 */
export async function transcribeAudio(buffer, { mimeType = 'audio/webm', language } = {}) {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error('Voice transcription is not configured on the server.');
  }

  const ext =
    mimeType.includes('mp4') || mimeType.includes('m4a')
      ? 'm4a'
      : mimeType.includes('mpeg') || mimeType.includes('mp3')
        ? 'mp3'
        : mimeType.includes('wav')
          ? 'wav'
          : 'webm';

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), `voice.${ext}`);
  form.append('model', process.env.SG16_WHISPER_MODEL || 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  if (language) form.append('language', language);

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || `Transcription failed (${res.status})`;
    throw new Error(msg);
  }

  const text = String(data.text || '').trim();
  if (!text) throw new Error('No speech detected. Try speaking closer to the microphone.');
  return text;
}

export async function handleSpeechTranscribe(req, res) {
  try {
    const { audio, mimeType, language } = req.body || {};
    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ error: 'Missing audio data.' });
    }

    const buffer = Buffer.from(audio, 'base64');
    if (buffer.length < 256) {
      return res.status(400).json({ error: 'Recording too short. Hold the mic and speak again.' });
    }
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Recording too long (max ~30 seconds).' });
    }

    const text = await transcribeAudio(buffer, { mimeType, language });
    return res.json({ text });
  } catch (err) {
    console.error('[SG16 speech]', err.message);
    return res.status(502).json({
      error: err.message || 'Voice transcription failed. Please try again.',
    });
  }
}

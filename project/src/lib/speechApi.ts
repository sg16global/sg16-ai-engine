import { authHeaders } from './authApi';

const API = '/api/v1';

export async function transcribeVoiceAudio(
  blob: Blob,
  mimeType: string,
  language?: string,
): Promise<string> {
  const base64 = await blobToBase64(blob);
  const res = await fetch(`${API}/speech/transcribe`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ audio: base64, mimeType, language }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'AUTH_REQUIRED') throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'Voice transcription failed');
  }
  return String(data.text || '').trim();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read audio recording'));
    reader.readAsDataURL(blob);
  });
}

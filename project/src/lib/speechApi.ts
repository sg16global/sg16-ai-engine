import { API_V1, ApiError, apiRequest } from './apiClient';
import { authHeaders } from './authApi';

export async function transcribeVoiceAudio(
  blob: Blob,
  mimeType: string,
  language?: string,
): Promise<string> {
  const base64 = await blobToBase64(blob);
  try {
    const data = await apiRequest<{ text?: string }>(`${API_V1}/speech/transcribe`, {
      method: 'POST',
      headers: authHeaders(),
      body: { audio: base64, mimeType, language },
      timeoutMs: 60_000,
    });
    return String(data.text || '').trim();
  } catch (err) {
    if (err instanceof ApiError && err.code === 'AUTH_REQUIRED') throw new Error('AUTH_REQUIRED');
    throw err;
  }
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

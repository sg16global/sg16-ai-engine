import { transcribeVoiceAudio } from './speechApi';

const MAX_RECORD_MS = 30_000;

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function browserSpeechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (isIOSDevice()) return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function mediaRecorderAvailable(): boolean {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
}

export function voiceInputAvailable(): boolean {
  return browserSpeechRecognitionAvailable() || mediaRecorderAvailable();
}

function pickRecorderMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', ''];
  return candidates.find((t) => !t || MediaRecorder.isTypeSupported(t)) || '';
}

export interface VoiceCaptureSession {
  stop: () => Promise<string>;
  cancel: () => void;
}

/** Tap mic → speak → tap again to finish (server path on iPhone). */
export function startVoiceCapture(language = 'en-US'): VoiceCaptureSession {
  if (browserSpeechRecognitionAvailable()) {
    return startBrowserRecognition(language);
  }
  if (mediaRecorderAvailable()) {
    return startMediaRecorderCapture(language);
  }
  throw new Error('Voice input is not supported on this device. Type your message instead.');
}

function startBrowserRecognition(language: string): VoiceCaptureSession {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = language;
  rec.interimResults = false;

  let settled = false;
  let resolve!: (value: string) => void;
  let reject!: (reason: Error) => void;
  const done = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const finish = (fn: () => void) => {
    if (settled) return;
    settled = true;
    fn();
  };

  rec.onresult = (e: SpeechRecognitionEvent) => {
    const transcript = e.results[0]?.[0]?.transcript?.trim();
    finish(() => (transcript ? resolve(transcript) : reject(new Error('No speech detected.'))));
  };
  rec.onerror = () => finish(() => reject(new Error('Microphone error. Check permissions and try again.')));
  rec.onend = () => finish(() => reject(new Error('Voice input stopped.')));

  rec.start();

  return {
    stop: () => {
      rec.stop();
      return done;
    },
    cancel: () => {
      settled = true;
      rec.abort();
    },
  };
}

function startMediaRecorderCapture(language: string): VoiceCaptureSession {
  const mimeType = pickRecorderMime();
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let stopResolve: ((text: string) => void) | null = null;
  let stopReject: ((err: Error) => void) | null = null;
  let started = false;

  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    recorder = null;
  };

  const startPromise = navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((mediaStream) => {
      stream = mediaStream;
      recorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
      const resolvedMime = recorder.mimeType || mimeType || 'audio/webm';

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onerror = () => {
        cleanup();
        stopReject?.(new Error('Recording failed. Allow microphone access and try again.'));
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: resolvedMime });
          if (blob.size < 256) {
            throw new Error('Recording too short. Tap mic, speak, then tap again.');
          }
          const text = await transcribeVoiceAudio(blob, resolvedMime, language.slice(0, 2));
          stopResolve?.(text);
        } catch (err) {
          stopReject?.(err instanceof Error ? err : new Error('Voice transcription failed.'));
        } finally {
          cleanup();
        }
      };

      recorder.start(250);
      started = true;
      timeoutId = setTimeout(() => {
        if (recorder?.state === 'recording') recorder.stop();
      }, MAX_RECORD_MS);

      return resolvedMime;
    })
    .catch((err) => {
      cleanup();
      throw err instanceof Error
        ? err
        : new Error('Microphone blocked. Allow mic access in browser settings.');
    });

  return {
    stop: () =>
      new Promise<string>((resolve, reject) => {
        stopResolve = resolve;
        stopReject = reject;
        startPromise
          .then(() => {
            if (!started || !recorder) {
              reject(new Error('Microphone not ready yet.'));
              return;
            }
            if (recorder.state === 'recording') recorder.stop();
            else reject(new Error('Recording already stopped.'));
          })
          .catch(reject);
      }),
    cancel: () => {
      if (recorder?.state === 'recording') recorder.stop();
      cleanup();
    },
  };
}

export function speakText(text: string, lang = 'en-US'): void {
  if (!('speechSynthesis' in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text.slice(0, 800));
  utter.lang = lang;
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

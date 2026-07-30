import { transcribeVoiceAudio } from './speechApi';

const MAX_RECORD_MS = 30_000;

/** Pre-rendered Microsoft Neural voice — cinematic SaaS tour tone. */
export const TOUR_VOICE_CLIPS = {
  intro: '/assets/tour-voice/intro.mp3',
  ai: '/assets/tour-voice/ai.mp3',
  student: '/assets/tour-voice/student.mp3',
  coding: '/assets/tour-voice/coding.mp3',
  health: '/assets/tour-voice/health.mp3',
  market: '/assets/tour-voice/market.mp3',
} as const;

export type TourVoiceClipKey = keyof typeof TOUR_VOICE_CLIPS;

/** Looping tour bed — extracted from reference pin (music only, no voiceover). */
export const TOUR_MUSIC_SRC = '/assets/tour-voice/tour-bg-music.mp3';

let tourMusic: HTMLAudioElement | null = null;
let tourAudio: HTMLAudioElement | null = null;
let tourVoiceCache: SpeechSynthesisVoice | null | undefined;

const TOUR_VOICE_HINTS = [
  'Hamdan',
  'Fatima',
  'Hamed',
  'Zariyah',
  'Salma',
  'Shakir',
  'ar-AE',
  'ar-SA',
  'Guy Online',
  'Jenny Neural',
  'Microsoft Guy',
  'Google US English',
];

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

export function speakText(text: string, lang = 'en-US', rate = 1, pitch = 1): void {
  if (!('speechSynthesis' in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text.slice(0, 800));
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = pitch;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking(): void {
  stopTourMusic();
  if (tourAudio) {
    tourAudio.pause();
    tourAudio.currentTime = 0;
    tourAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/** Looping cinematic bed for homepage tour. */
export function playTourMusic(): void {
  if (typeof window === 'undefined') return;
  if (tourMusic && !tourMusic.paused) return;
  if (!tourMusic) {
    tourMusic = new Audio(TOUR_MUSIC_SRC);
    tourMusic.loop = true;
    tourMusic.preload = 'auto';
    tourMusic.volume = 0.38;
  }
  void tourMusic.play().catch(() => {});
}

export function stopTourMusic(): void {
  if (!tourMusic) return;
  tourMusic.pause();
  tourMusic.currentTime = 0;
}

function pickTourVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const arabic = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ar'));
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const pool = arabic.length ? arabic : english.length ? english : voices;

  for (const hint of TOUR_VOICE_HINTS) {
    const match = pool.find((voice) => voice.name.includes(hint));
    if (match) return match;
  }

  return (
    pool.find((voice) => /natural|neural|premium|online/i.test(voice.name)) ||
    pool.find((voice) => voice.localService === false) ||
    pool[0] ||
    null
  );
}

function ensureTourVoice(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve(null);
  }
  if (tourVoiceCache !== undefined) {
    return Promise.resolve(tourVoiceCache);
  }

  return new Promise((resolve) => {
    const sync = () => {
      tourVoiceCache = pickTourVoice(window.speechSynthesis.getVoices());
      resolve(tourVoiceCache);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      sync();
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      sync();
    };
    window.setTimeout(sync, 400);
  });
}

async function playTourClip(src: string): Promise<void> {
  tourAudio = new Audio(src);
  tourAudio.preload = 'auto';
  tourAudio.volume = 0.94;
  await tourAudio.play();
}

function speakTourFallback(text: string): void {
  if (!('speechSynthesis' in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text.slice(0, 800));
  utter.lang = 'ar-SA';
  utter.rate = 0.88;
  utter.pitch = 0.96;
  utter.volume = 1;
  void ensureTourVoice().then((voice) => {
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  });
}

/** Cinematic homepage tour — neural MP3 first, premium browser voice fallback. */
export function speakTourNarration(text: string, clipKey?: TourVoiceClipKey): void {
  stopSpeaking();
  const src = clipKey ? TOUR_VOICE_CLIPS[clipKey] : undefined;
  if (src) {
    void playTourClip(src).catch(() => speakTourFallback(text));
    return;
  }
  speakTourFallback(text);
}

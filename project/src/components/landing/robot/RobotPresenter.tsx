import { useEffect, useMemo, useRef, useState } from 'react';
import { Rocket, Volume2, VolumeX, X } from 'lucide-react';
import { Flag, type FlagCode } from '../Flag';
import { PIONEERS, WORLD_AI } from '../LandingRails';
import { buildRobotScript, type RobotSegment } from './robotScript';
import './robot.css';

/**
 * SG16 AI Engine Robo — top-right of the public homepage (owner request 2026-11-13).
 *
 * The owner's robot video loops silently in the page (no box: its edges fade into the
 * background). After the visitor's first tap / click / key press (browsers allow sound only
 * after one) the robot greets, presents the flags, pioneers, World's AI and the shields with a
 * speech bubble, pauses 5 s and starts again. Mute button; pauses while the tab is hidden.
 *
 * Voice: the owner's recorded MP3s (one per segment, see robotScript.ts) once VOICE_FILES_READY
 * is true; until then the best male English voice the visitor's browser offers.
 */

const VOICE_FILES_READY = false;
const VOICE_DIR = '/landing/robot/voice';
const VIDEO_SRC = '/landing/robot/sg16-robot.mp4';
const POSTER_SRC = '/landing/robot/sg16-robot-poster.webp';
const LOOP_PAUSE_MS = 5000;
const TOGGLE_KEY = 'sg16_robot_on';

interface RobotPresenterProps {
  flags: { code: FlagCode; name: string }[];
  shields: { title: string; desc: string }[];
  onStartTour: () => void;
  /** Turn the robot off: the homepage goes back to its original layout. */
  onHide: () => void;
}

/* ── On / off toggle (remembered on this device) ── */

export function useRobotToggle(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(TOGGLE_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const set = (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem(TOGGLE_KEY, next ? '1' : '0');
    } catch {
      /* storage blocked — the choice lasts for this page view */
    }
  };
  return [on, set];
}

/** Shown while the robot is off: brings it back. */
export function RobotShowButton({ onShow }: { onShow: () => void }) {
  return (
    <button type="button" className="sg16-robot-show" onClick={onShow} aria-label="Show SG16 AI Engine Robo" title="Show SG16 Robo">
      <img src={POSTER_SRC} alt="" draggable={false} />
    </button>
  );
}

/* ── Voice ── */

const MALE_NAMES =
  /\b(guy|andrew|brian|christopher|eric|roger|steffan|ryan|davis|tony|jason|aaron|daniel|alex|fred|thomas|william|david|mark|george|richard|male)\b/i;
const FEMALE_NAMES = /\b(female|zira|aria|jenny|samantha|susan|hazel|libby|sonia|emma|ava|michelle|karen|moira|tessa|victoria|fiona)\b/i;

function pickVoice(): SpeechSynthesisVoice | null {
  const english = window.speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
  const score = (v: SpeechSynthesisVoice) =>
    (MALE_NAMES.test(v.name) ? 4 : 0) +
    (/natural|online|neural|premium|enhanced/i.test(v.name) ? 2 : 0) +
    (/en[-_]us/i.test(v.lang) ? 1 : 0) -
    (FEMALE_NAMES.test(v.name) ? 6 : 0);
  return english.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Reading time when there is no sound (muted, or no voice on this device). */
function estimateMs(text: string): number {
  return Math.max(2500, (text.split(/\s+/).length / 2.6) * 1000 + 600);
}

/** Chrome cuts long utterances short, so speak one sentence at a time. */
function sentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

function speakSentence(text: string, onStart: () => void): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-US';
    u.rate = 1;
    u.pitch = 1.05;
    // Some browsers never fire "end"; never wait longer than twice the reading time.
    const guard = window.setTimeout(resolve, estimateMs(text) * 2 + 3000);
    const done = () => {
      window.clearTimeout(guard);
      resolve();
    };
    u.onstart = onStart;
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  });
}

/* ── What the bubble shows for each segment ── */

function SegmentVisual({
  segment,
  flags,
  shields,
  onStartTour,
}: { segment: RobotSegment } & Omit<RobotPresenterProps, 'onHide'>) {
  switch (segment.id) {
    case 'flags':
      return (
        <ul className="sg16-robot-items sg16-robot-items--flags">
          {flags.map((f, i) => (
            <li key={f.code} style={{ animationDelay: `${i * 140}ms` }}>
              <Flag code={f.code} />
              <span>{f.name}</span>
            </li>
          ))}
        </ul>
      );
    case 'pioneers':
      return (
        <ul className="sg16-robot-items sg16-robot-items--pioneers">
          {PIONEERS.map((p, i) => (
            <li key={p.id} style={{ animationDelay: `${i * 110}ms` }} title={p.name}>
              <img src={`/landing/pioneers/${p.id}.webp`} alt={p.name} width={34} height={34} loading="lazy" decoding="async" draggable={false} />
            </li>
          ))}
        </ul>
      );
    case 'world-ai':
      return (
        <ul className="sg16-robot-items sg16-robot-items--chips">
          {WORLD_AI.map(([name, maker], i) => (
            <li key={name} style={{ animationDelay: `${i * 90}ms` }} title={maker}>
              {name}
            </li>
          ))}
        </ul>
      );
    case 'shields':
      return (
        <ul className="sg16-robot-items sg16-robot-items--chips">
          {shields.map((s, i) => (
            <li key={s.title} style={{ animationDelay: `${i * 160}ms` }} title={s.desc}>
              {s.title}
            </li>
          ))}
        </ul>
      );
    case 'goodbye':
      return (
        <button type="button" className="sg16-robot-cta" onClick={onStartTour}>
          <Rocket className="h-4 w-4" /> Start Tour
        </button>
      );
    default:
      return null;
  }
}

/* ── Robot ── */

export function RobotPresenter(props: RobotPresenterProps) {
  const { flags, shields } = props;
  const script = useMemo(
    () => buildRobotScript({ flags, pioneers: PIONEERS, worldAi: WORLD_AI, shields }),
    [flags, shields],
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Reduced motion: show the still picture instead of the moving video.
  useEffect(() => {
    const video = videoRef.current;
    if (video && window.matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
  }, []);

  // Start on the visitor's first interaction with the page.
  useEffect(() => {
    if (started) return;
    const start = () => {
      if (hasSpeech) {
        // Unlocks speech on Safari/iOS, which only allows it inside a user gesture.
        const unlock = new SpeechSynthesisUtterance(' ');
        unlock.volume = 0;
        window.speechSynthesis.speak(unlock);
      }
      setStarted(true);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, start));
  }, [started, hasSpeech]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Voices load asynchronously in Chrome; ask early so the first sentence gets the chosen voice.
  useEffect(() => {
    if (hasSpeech) window.speechSynthesis.getVoices();
  }, [hasSpeech]);

  // Play the current segment, then move on; after the last one, pause and start again.
  useEffect(() => {
    if (!started || hidden) return;
    let cancelled = false;
    const timers: number[] = [];
    let audio: HTMLAudioElement | null = null;
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    const segment = script[index];

    const playFile = () =>
      new Promise<boolean>((resolve) => {
        audio = new Audio(`${VOICE_DIR}/${segment.id}.mp3`);
        audio.onplaying = () => !cancelled && setSpeaking(true);
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.play().catch(() => resolve(false));
      });

    const say = async () => {
      if (muted) return wait(estimateMs(segment.text));
      if (VOICE_FILES_READY && (await playFile())) return;
      if (cancelled) return;
      if (!hasSpeech) return wait(estimateMs(segment.text));
      for (const line of sentences(segment.text)) {
        if (cancelled) return;
        await speakSentence(line, () => !cancelled && setSpeaking(true));
      }
    };

    void (async () => {
      await say();
      if (cancelled) return;
      setSpeaking(false);
      if (index < script.length - 1) {
        setIndex(index + 1);
        return;
      }
      await wait(LOOP_PAUSE_MS);
      if (!cancelled) setIndex(0);
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (hasSpeech) window.speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [started, hidden, index, muted, script, hasSpeech]);

  const segment = script[index];

  return (
    <div className={`sg16-robot${speaking ? ' is-speaking' : ''}`} aria-label="SG16 AI Engine Robo">
      <div className="sg16-robot__stage">
        <video
          ref={videoRef}
          className="sg16-robot__video"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="sg16-robot__controls">
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              setMuted((m) => !m);
            }}
            aria-label={muted ? 'Turn the robot voice on' : 'Mute the robot voice'}
            title={muted ? 'Sound on' : 'Mute'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button type="button" onClick={props.onHide} aria-label="Turn the robot off" title="Hide robot">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="sg16-robot-bubble" aria-live="polite">
        {started ? (
          <div key={`${segment.id}-${index}`} className="sg16-robot-bubble__body">
            <p className="sg16-robot-bubble__text">{segment.text}</p>
            <SegmentVisual segment={segment} {...props} />
          </div>
        ) : (
          <div className="sg16-robot-bubble__body">
            <p className="sg16-robot-bubble__text">
              <strong>Hi!</strong> Tap anywhere and I&apos;ll show you around SG16.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

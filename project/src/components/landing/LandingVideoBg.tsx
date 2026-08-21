import { useEffect, useRef, useState } from 'react';

import { LANDING_VIDEO_DESKTOP } from '../../core/landingAssets';

/** Skip baked-in fade frames at clip start/end so the loop never pulses dark. */
const LOOP_LEAD_IN_SEC = 0.22;
const LOOP_TAIL_SEC = 0.45;

function prepVideo(el: HTMLVideoElement) {
  el.muted = true;
  el.defaultMuted = true;
  el.playsInline = true;
  el.preload = 'auto';
}

function loopEnd(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 5.35;
  return Math.max(LOOP_LEAD_IN_SEC + 0.35, duration - LOOP_TAIL_SEC);
}

/** Full-screen brain background — seamless trim loop, no fade pulse on repeat. */
export function LandingVideoBg() {
  const refs = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);
  const activeIdx = useRef(0);
  const [front, setFront] = useState(0);

  useEffect(() => {
    const [a, b] = refs.current;
    if (!a || !b) return;

    prepVideo(a);
    prepVideo(b);

    const videos = [a, b];
    let cancelled = false;

    const prime = (el: HTMLVideoElement) => {
      el.currentTime = LOOP_LEAD_IN_SEC;
    };

    const onTimeUpdate = (idx: number) => {
      if (cancelled) return;

      const current = videos[idx];
      const next = videos[1 - idx];
      const end = loopEnd(current.duration);

      if (current.currentTime >= end - 0.1 && next.paused) {
        prime(next);
        void next.play().catch(() => {});
      }

      if (current.currentTime >= end) {
        current.pause();
        activeIdx.current = 1 - idx;
        setFront(activeIdx.current);
      }
    };

    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const current = videos[activeIdx.current];
      if (current.paused) void current.play().catch(() => {});
    };

    const onTimeUpdateA = () => onTimeUpdate(0);
    const onTimeUpdateB = () => onTimeUpdate(1);

    a.addEventListener('timeupdate', onTimeUpdateA);
    b.addEventListener('timeupdate', onTimeUpdateB);
    document.addEventListener('visibilitychange', onVis);

    prime(a);
    void a.play().catch(() => {
      window.setTimeout(() => void a.play().catch(() => {}), 400);
    });

    return () => {
      cancelled = true;
      a.removeEventListener('timeupdate', onTimeUpdateA);
      b.removeEventListener('timeupdate', onTimeUpdateB);
      document.removeEventListener('visibilitychange', onVis);
      a.pause();
      b.pause();
    };
  }, []);

  return (
    <div className="landing-video-bg" aria-hidden>
      {[0, 1].map((i) => (
        <video
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`landing-video-bg__video${front === i ? ' landing-video-bg__video--active' : ''}`}
          src={LANDING_VIDEO_DESKTOP}
          autoPlay={i === 0}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />
      ))}
      <div className="landing-video-bg__shade" />
    </div>
  );
}

export const LANDING_LOGO = '/landing/sg16-hero-logo.png';

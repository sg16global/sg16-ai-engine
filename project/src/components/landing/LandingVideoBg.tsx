import { useEffect, useRef } from 'react';

import { LANDING_VIDEO_DESKTOP } from '../../core/landingAssets';

/** Tiny tail buffer so we seek before the browser hits the last frame pause. */
const LOOP_TAIL_SEC = 0.04;

/** Full-screen brain background — single element, seek loop (no opacity swap flash). */
export function LandingVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let cancelled = false;

    const play = () => {
      if (cancelled) return;
      void video.play().catch(() => {
        window.setTimeout(() => void video.play().catch(() => {}), 400);
      });
    };

    const onTimeUpdate = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const loopAt = duration - LOOP_TAIL_SEC;
      if (video.currentTime >= loopAt) {
        video.currentTime = 0;
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible' && video.paused) play();
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadeddata', play);
    video.addEventListener('canplay', play);
    document.addEventListener('visibilitychange', onVis);

    play();

    return () => {
      cancelled = true;
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadeddata', play);
      video.removeEventListener('canplay', play);
      document.removeEventListener('visibilitychange', onVis);
      video.pause();
    };
  }, []);

  return (
    <div className="landing-video-bg" aria-hidden>
      <video
        ref={videoRef}
        className="landing-video-bg__video"
        src={LANDING_VIDEO_DESKTOP}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <div className="landing-video-bg__shade" />
    </div>
  );
}

export const LANDING_LOGO = '/landing/sg16-hero-logo.png';

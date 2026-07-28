import { useEffect, useRef, useState } from 'react';

/** Slow Earth — 1920×1080 landscape (CURSOR BOSS / IMG_7445.MP4). */
const LANDING_VIDEO = '/landing/sg16-earth-slow.mp4';
const LANDING_VIDEO_FALLBACK = '/landing/sg16home-landscape.mp4';
const LANDING_POSTER = '/landing/hero-background.webp';

/** Full-viewport hero video — muted autoplay loop (no sound — browser safe). */
export function LandingVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(LANDING_VIDEO);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const play = () => {
      void video.play().catch(() => {
        window.setTimeout(() => void video.play().catch(() => {}), 500);
      });
    };

    play();
    video.addEventListener('canplay', play, { once: true });

    const onVis = () => {
      if (document.visibilityState === 'visible' && video.paused) play();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      video.removeEventListener('canplay', play);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [src]);

  return (
    <div className="landing-video-bg" aria-hidden>
      <video
        ref={videoRef}
        className="landing-video-bg__video"
        src={src}
        poster={LANDING_POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        onError={() => {
          if (src !== LANDING_VIDEO_FALLBACK) setSrc(LANDING_VIDEO_FALLBACK);
        }}
      />
      <div className="landing-video-bg__shade" />
    </div>
  );
}

export const LANDING_LOGO = '/landing/sg16-hero-logo.png';

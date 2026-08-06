import { useEffect, useRef } from 'react';

import { LANDING_VIDEO_DESKTOP } from '../../core/landingAssets';

/** Full-screen bossss.mp4 — autoplay, muted, loop, object-fit cover. */
export function LandingVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;

    const play = () => {
      void video.play().catch(() => {
        window.setTimeout(() => void video.play().catch(() => {}), 600);
      });
    };

    play();
    video.addEventListener('canplay', play);
    video.addEventListener('loadeddata', play);

    const onVis = () => {
      if (document.visibilityState === 'visible' && video.paused) play();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      video.removeEventListener('canplay', play);
      video.removeEventListener('loadeddata', play);
      document.removeEventListener('visibilitychange', onVis);
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
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <div className="landing-video-bg__shade" />
    </div>
  );
}

export const LANDING_LOGO = '/landing/sg16-hero-logo.png';

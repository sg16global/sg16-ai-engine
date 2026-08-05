import { useEffect, useRef, useState } from 'react';

import { LANDING_VIDEO, LANDING_POSTER } from '../../core/landingAssets';

/** Full-viewport hero video — muted autoplay loop (no sound — browser safe). */
export function LandingVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

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
    video.addEventListener('loadeddata', play, { once: true });

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
    <div className={`landing-video-bg${failed ? ' landing-video-bg--poster' : ''}`} aria-hidden>
      <video
        ref={videoRef}
        className="landing-video-bg__video"
        src={LANDING_VIDEO}
        poster={LANDING_POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        onError={() => setFailed(true)}
      />
      <div className="landing-video-bg__shade" />
    </div>
  );
}

export const LANDING_LOGO = '/landing/sg16-hero-logo.png';

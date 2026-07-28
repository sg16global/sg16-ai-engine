import { useEffect, useRef, useState } from 'react';

/** Original portrait video (mobile) + landscape crop (desktop). */
const LANDING_VIDEO_DESKTOP = '/landing/sg16home-landscape.mp4';
const LANDING_VIDEO_MOBILE = '/landing/sg16home.mp4';

/** Full-viewport hero video — muted autoplay loop, edge-to-edge cover. */
export function LandingVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? LANDING_VIDEO_MOBILE
      : LANDING_VIDEO_DESKTOP),
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setSrc(mq.matches ? LANDING_VIDEO_MOBILE : LANDING_VIDEO_DESKTOP);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.load();

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
        key={src}
        ref={videoRef}
        className="landing-video-bg__video"
        src={src}
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

import { useEffect, useRef } from 'react';

/** Desktop boss Earth — boss_7445 (1).mp4 @ 2560×1440 → sg16-earth-slow.mp4 */
const LANDING_VIDEO = '/landing/sg16-earth-slow.mp4';

/** Full-viewport hero video — muted autoplay loop (no sound — browser safe). */
export function LandingVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <div className="landing-video-bg" aria-hidden>
      <video
        ref={videoRef}
        className="landing-video-bg__video"
        src={LANDING_VIDEO}
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

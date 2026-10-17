/**
 * Landing ambient layer — sparse pink starfield + top bloom.
 * Decorative only: the page background itself comes from .sg16-app-shell.
 */
export function LandingNeonBackdrop() {
  return <div className="lp-starfield" aria-hidden />;
}

/** Hero stage art: glowing dome with lat/long grid, starfield, and the neon podium. */
export function HeroStage() {
  return (
    <>
      <div className="lp-hero__sky" aria-hidden>
        <div className="lp-starfield" />
        <div className="lp-dome">
          <svg className="lp-dome__grid" viewBox="0 0 200 200" fill="none" stroke="#FF5CB8" strokeWidth="0.35">
            <circle cx="100" cy="100" r="97" />
            <ellipse cx="100" cy="100" rx="66" ry="97" />
            <ellipse cx="100" cy="100" rx="32" ry="97" />
            <path d="M100 3V197" />
            <ellipse cx="100" cy="100" rx="97" ry="26" />
            <ellipse cx="100" cy="62" rx="84" ry="20" />
            <ellipse cx="100" cy="30" rx="56" ry="11" />
          </svg>
        </div>
      </div>
      <div className="lp-podium" aria-hidden>
        <div className="lp-podium__beam" />
        <div className="lp-podium__base" />
        <div className="lp-podium__body" />
        <div className="lp-podium__top" />
      </div>
    </>
  );
}

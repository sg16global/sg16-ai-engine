import { useId } from 'react';

type HudFrameProps = {
  className?: string;
  variant?: 'panel' | 'clock' | 'status';
};

/**
 * Decorative neon HUD frame (SVG asset) — corners + thin rim.
 * Content is HTML; this is only the graphic chrome.
 */
export function HudFrame({ className = '', variant = 'panel' }: HudFrameProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `hud-stroke-${variant}-${uid}`;
  const r = variant === 'clock' ? 14 : 10;

  return (
    <svg
      className={`sg16-sh__hud-frame ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff617a" />
          <stop offset="50%" stopColor="#ff365a" />
          <stop offset="100%" stopColor="#ff617a" />
        </linearGradient>
      </defs>

      <rect
        x="1.2"
        y="1.2"
        width="97.6"
        height="97.6"
        rx={r}
        ry={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.4"
        opacity="0.95"
      />

      <path d="M8 4 H18" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 8 V18" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M82 4 H92" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M96 8 V18" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 96 H18" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 82 V92" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M82 96 H92" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M96 82 V92" stroke="#ff8a9a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

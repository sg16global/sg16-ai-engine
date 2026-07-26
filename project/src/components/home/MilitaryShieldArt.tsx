/**
 * Multi-layer military crest SVG artwork.
 * Layout is React/CSS; this file is the graphic asset (fill, rim, bevel, tip).
 */

/** Sharp military shield — shoulders + long point (viewBox 0 0 200 280) */
export const MILITARY_SHIELD_PATH =
  'M100 8 L158 18 L182 36 L188 52 L188 118 L172 188 L136 240 L100 270 L64 240 L28 188 L12 118 L12 52 L18 36 L42 18 Z';

type MilitaryShieldArtProps = {
  id: string;
};

export function MilitaryShieldArt({ id }: MilitaryShieldArtProps) {
  const fill = `sg16-ms-fill-${id}`;
  const gloss = `sg16-ms-gloss-${id}`;
  const rimGlow = `sg16-ms-rim-${id}`;
  const clip = `sg16-ms-clip-${id}`;

  return (
    <svg
      className="sg16-sh__shield-svg"
      viewBox="0 0 200 280"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fill} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="38%" stopColor="#ff173d" />
          <stop offset="72%" stopColor="#c4002a" />
          <stop offset="100%" stopColor="#7a0018" />
        </linearGradient>
        <linearGradient id={gloss} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={rimGlow} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={clip}>
          <path d={MILITARY_SHIELD_PATH} />
        </clipPath>
      </defs>

      {/* Soft outer neon wire (asset-level, not CSS blur bomb) */}
      <path
        d={MILITARY_SHIELD_PATH}
        fill="none"
        stroke="#ff617a"
        strokeWidth="5"
        opacity="0.35"
        filter={`url(#${rimGlow})`}
      />

      {/* Body */}
      <path d={MILITARY_SHIELD_PATH} fill={`url(#${fill})`} />

      {/* Inner plate */}
      <path
        d="M100 22 L150 30 L168 44 L172 56 L172 116 L158 178 L130 224 L100 250 L70 224 L42 178 L28 116 L28 56 L32 44 L50 30 Z"
        fill="#8a001c"
        opacity="0.35"
      />

      {/* Gloss / reflection */}
      <g clipPath={`url(#${clip})`}>
        <path
          d="M40 30 L100 18 L160 30 L148 120 L100 150 L52 120 Z"
          fill={`url(#${gloss})`}
        />
        <path
          d="M100 8 L158 18 L182 36 L188 52 L188 90 L12 90 L12 52 L18 36 L42 18 Z"
          fill="#ff8a9a"
          opacity="0.12"
        />
      </g>

      {/* Thin neon rim — concept look */}
      <path
        d={MILITARY_SHIELD_PATH}
        fill="none"
        stroke="#ff617a"
        strokeWidth="2.2"
        filter={`url(#${rimGlow})`}
      />

      {/* Inner neon hairline */}
      <path
        d="M100 18 L152 26 L170 40 L174 54 L174 116 L160 176 L132 220 L100 246 L68 220 L40 176 L26 116 L26 54 L30 40 L48 26 Z"
        fill="none"
        stroke="rgba(255,200,210,0.45)"
        strokeWidth="1"
      />
    </svg>
  );
}

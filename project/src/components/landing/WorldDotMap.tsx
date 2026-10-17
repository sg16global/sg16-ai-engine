import { useId } from 'react';

/**
 * Dot-matrix world map (equirectangular, 5° grid) for the landing HUD panels.
 * Land is described as longitude ranges per 5° latitude band — coarse on purpose,
 * it only has to read as a world map at card size.
 */
const LAND: Record<number, [number, number][]> = {
  80: [[-60, -20], [15, 25], [55, 100]],
  75: [[-120, -75], [-70, -20], [60, 140]],
  70: [[-165, -140], [-140, -70], [-55, -22], [18, 30], [30, 180]],
  65: [[-165, -62], [-52, -38], [-22, -14], [10, 180]],
  60: [[-160, -65], [-48, -42], [5, 165]],
  55: [[-130, -60], [-6, 0], [5, 140], [155, 162]],
  50: [[-125, -55], [-5, 140]],
  45: [[-124, -65], [-2, 135], [140, 145]],
  40: [[-124, -72], [-9, 3], [12, 122], [126, 129], [135, 142]],
  35: [[-120, -77], [-8, 10], [22, 120], [132, 140]],
  30: [[-115, -82], [-10, 122]],
  25: [[-110, -97], [-82, -80], [-15, 57], [68, 92], [98, 121]],
  20: [[-105, -87], [-84, -75], [-17, 58], [72, 87], [93, 108]],
  15: [[-92, -84], [-17, 40], [43, 52], [74, 80], [98, 109], [120, 124]],
  10: [[-85, -62], [-15, 45], [76, 80], [98, 106], [122, 126]],
  5: [[-78, -50], [-10, 48], [100, 104], [110, 118]],
  0: [[-80, -48], [9, 42], [98, 106], [109, 118], [120, 124]],
  [-5]: [[-80, -35], [12, 40], [105, 115], [120, 150]],
  [-10]: [[-78, -36], [13, 40], [130, 150]],
  [-15]: [[-75, -39], [12, 40], [44, 50], [125, 145]],
  [-20]: [[-70, -40], [13, 35], [44, 48], [114, 150]],
  [-25]: [[-70, -45], [15, 33], [114, 153]],
  [-30]: [[-72, -50], [17, 31], [115, 153]],
  [-35]: [[-72, -57], [18, 25], [136, 150], [173, 178]],
  [-40]: [[-73, -62], [172, 176]],
  [-45]: [[-74, -65], [145, 148], [167, 171]],
  [-50]: [[-75, -68]],
  [-55]: [[-70, -66]],
};

const STEP = 5;
const W = 360 / STEP;
const H = (85 + 60) / STEP;

// Adjacent ranges may share an edge longitude — dedupe so each dot renders once.
const DOT_KEYS = new Set<string>();
for (const [latKey, ranges] of Object.entries(LAND)) {
  const y = (80 - Number(latKey)) / STEP;
  for (const [a, b] of ranges) {
    for (let lon = a; lon <= b; lon += STEP) DOT_KEYS.add(`${(lon + 180) / STEP},${y}`);
  }
}
const DOTS = [...DOT_KEYS].map((k) => k.split(',').map(Number) as [number, number]);

/** Live "hot" points: [lon, lat] */
const HOT_POINTS: [number, number][] = [
  [102, 2], [-74, 40], [0, 51], [8, 50], [139, 35], [127, 37], [5, 52], [-122, 37], [151, -33],
];

export function WorldDotMap({ className = '' }: { className?: string }) {
  const glowId = `wdm-glow-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={className}
      viewBox={`-1 -1 ${W + 2} ${H + 2}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <filter id={glowId} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <g fill="rgba(255, 92, 184, 0.34)">
        {DOTS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={0.36} />
        ))}
      </g>
      {HOT_POINTS.map(([lon, lat]) => {
        const x = (lon + 180) / STEP;
        const y = (80 - lat) / STEP;
        return (
          <g key={`${lon}-${lat}`}>
            <circle cx={x} cy={y} r={1.6} fill="#FF168D" opacity={0.7} filter={`url(#${glowId})`} />
            <circle cx={x} cy={y} r={0.65} fill="#FFD6EC" />
          </g>
        );
      })}
    </svg>
  );
}

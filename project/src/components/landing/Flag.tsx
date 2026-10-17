/**
 * Simplified inline SVG flags (3:2). Emoji flags render as plain letters on
 * Windows, so the landing page draws its own.
 */
export type FlagCode = 'us' | 'gb' | 'fr' | 'ru' | 'cn' | 'de' | 'nl' | 'jp' | 'my';

function Tricolor({ colors, vertical }: { colors: [string, string, string]; vertical?: boolean }) {
  return (
    <>
      {colors.map((c, i) =>
        vertical ? (
          <rect key={c + i} x={i * 10} y={0} width={10} height={20} fill={c} />
        ) : (
          <rect key={c + i} x={0} y={(i * 20) / 3} width={30} height={20 / 3 + 0.1} fill={c} />
        ),
      )}
    </>
  );
}

function Stripes({ count, a, b }: { count: number; a: string; b: string }) {
  const h = 20 / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={0} y={i * h} width={30} height={h + 0.05} fill={i % 2 ? b : a} />
      ))}
    </>
  );
}

const ART: Record<FlagCode, JSX.Element> = {
  us: (
    <>
      <Stripes count={13} a="#B22234" b="#FFFFFF" />
      <rect width={13} height={10.8} fill="#3C3B6E" />
    </>
  ),
  gb: (
    <>
      <rect width={30} height={20} fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#FFFFFF" strokeWidth={4} />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth={1.6} />
      <path d="M15 0V20M0 10H30" stroke="#FFFFFF" strokeWidth={6} />
      <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth={3.6} />
    </>
  ),
  fr: <Tricolor vertical colors={['#0055A4', '#FFFFFF', '#EF4135']} />,
  ru: <Tricolor colors={['#FFFFFF', '#0039A6', '#D52B1E']} />,
  cn: (
    <>
      <rect width={30} height={20} fill="#DE2910" />
      <path d="M5 2.2l1.2 3.6H10L6.9 8l1.2 3.6L5 9.4 1.9 11.6 3.1 8 0 5.8h3.8z" fill="#FFDE00" />
    </>
  ),
  de: <Tricolor colors={['#000000', '#DD0000', '#FFCE00']} />,
  nl: <Tricolor colors={['#AE1C28', '#FFFFFF', '#21468B']} />,
  jp: (
    <>
      <rect width={30} height={20} fill="#FFFFFF" />
      <circle cx={15} cy={10} r={6} fill="#BC002D" />
    </>
  ),
  my: (
    <>
      <Stripes count={14} a="#CC0001" b="#FFFFFF" />
      <rect width={15} height={11.4} fill="#010066" />
      <circle cx={6} cy={5.7} r={3.6} fill="#FFCC00" />
      <circle cx={7.2} cy={5.7} r={3} fill="#010066" />
    </>
  ),
};

export function Flag({ code, className = '' }: { code: FlagCode; className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={`lp-flag ${className}`.trim()} aria-hidden>
      {ART[code]}
    </svg>
  );
}

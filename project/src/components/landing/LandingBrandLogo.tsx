import { LANDING_LOGO } from './LandingVideoBg';

type LandingBrandLogoProps = {
  className?: string;
  compact?: boolean;
};

/** SG16 earth + DNA logo — header, hero, footer. */
export function LandingBrandLogo({ className = '', compact = false }: LandingBrandLogoProps) {
  return (
    <img
      src={LANDING_LOGO}
      alt="SG16 AI Engine"
      className={`object-contain object-left ${compact ? 'h-9 sm:h-10 w-auto max-w-[140px]' : 'h-auto w-full max-w-[min(92vw,520px)]'} ${className}`.trim()}
      width={compact ? 140 : 520}
      height={compact ? 40 : 280}
      decoding="async"
    />
  );
}

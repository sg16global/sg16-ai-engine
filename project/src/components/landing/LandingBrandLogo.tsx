import { SG16_BRAND } from '../../core/branding';
import './landingStyles.css';

type LandingBrandLogoProps = {
  className?: string;
  compact?: boolean;
};

/**
 * SG16 brand lockup — neon emblem + chrome-pink "SG16" + white "AI Engine".
 * `compact` drops the "AI Engine" wordmark below the sm breakpoint.
 */
export function LandingBrandLogo({ className = '', compact = false }: LandingBrandLogoProps) {
  return (
    <span className={`lp-brand ${className}`.trim()}>
      <picture>
        <source srcSet={SG16_BRAND.logo.replace(/\.png$/, '.webp')} type="image/webp" />
        <img src={SG16_BRAND.logo} alt="" className="lp-brand__emblem" width={48} height={48} decoding="async" />
      </picture>
      <span className="lp-brand__mark" aria-hidden>
        SG16
      </span>
      <span className={`lp-brand__name ${compact ? 'hidden sm:inline' : ''}`.trim()} aria-hidden>
        AI Engine
      </span>
      <span className="sr-only">{SG16_BRAND.name}</span>
    </span>
  );
}

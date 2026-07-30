import { useState } from 'react';
import { SG16_BRAND } from '../../core/branding';
import { OptimizedImage } from './OptimizedImage';

const LOGO_SOURCES = [
  SG16_BRAND.logo,
  SG16_BRAND.logoFallback,
  '/hero.png',
  '/hero-globe.png',
  '/logo.svg',
];

interface Sg16LogoProps {
  className?: string;
  glow?: boolean;
}

export function Sg16Logo({ className = '', glow = false }: Sg16LogoProps) {
  const [sourceIndex, setSourceIndex] = useState(0);

  return (
    <span className={`relative inline-flex shrink-0 ${glow ? 'before:absolute before:inset-0 before:bg-emerald-500/25 before:blur-2xl before:rounded-full before:scale-110' : ''}`}>
      <OptimizedImage
        src={LOGO_SOURCES[sourceIndex]}
        alt={SG16_BRAND.logoAlt}
        className={`relative object-contain ${className}`}
        onError={() => setSourceIndex((i) => Math.min(i + 1, LOGO_SOURCES.length - 1))}
        decoding="async"
      />
    </span>
  );
}

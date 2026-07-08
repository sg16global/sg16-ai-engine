const RASTER_EXT = /\.(png|jpe?g)$/i;

/** Paths that receive a `-mobile.webp` variant at build time (LCP-critical). */
const MOBILE_WEBP_PATHS = new Set([
  '/hero.png',
  '/hero-globe.png',
  '/landing/hero-background.png',
]);

export function isOptimizableAsset(src: string): boolean {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (/^https?:\/\//i.test(src)) return false;
  return RASTER_EXT.test(src);
}

export function toWebpPath(src: string): string {
  return src.replace(RASTER_EXT, '.webp');
}

export function toMobileWebpPath(src: string): string | null {
  if (!MOBILE_WEBP_PATHS.has(src)) return null;
  return src.replace(RASTER_EXT, '-mobile.webp');
}

export interface OptimizedImageSources {
  raster: string;
  webp: string | null;
  mobileWebp: string | null;
}

export function getOptimizedImageSources(src: string): OptimizedImageSources {
  if (!isOptimizableAsset(src)) {
    return { raster: src, webp: null, mobileWebp: null };
  }
  return {
    raster: src,
    webp: toWebpPath(src),
    mobileWebp: toMobileWebpPath(src),
  };
}

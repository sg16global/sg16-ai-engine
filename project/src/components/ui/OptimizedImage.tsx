import type { ImgHTMLAttributes } from 'react';
import { getOptimizedImageSources } from '../../lib/optimizedImage';

export interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Serves WebP when a build-time `.webp` sibling exists (see scripts/generate-pwa-assets.mjs).
 * Falls back to the original PNG/JPEG for older browsers.
 */
export function OptimizedImage({ src, alt = '', ...props }: OptimizedImageProps) {
  const { raster, webp, mobileWebp } = getOptimizedImageSources(src);

  if (!webp) {
    return <img src={raster} alt={alt} {...props} />;
  }

  return (
    <picture>
      {mobileWebp && (
        <source media="(max-width: 768px)" srcSet={mobileWebp} type="image/webp" />
      )}
      <source srcSet={webp} type="image/webp" />
      <img src={raster} alt={alt} {...props} />
    </picture>
  );
}

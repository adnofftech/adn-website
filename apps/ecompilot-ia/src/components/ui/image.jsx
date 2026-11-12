import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Composant Image de Base44 (Wix Media) : responsive, WebP, lazy.
 * À utiliser pour tout média Base44, jamais un <img> brut.
 */
export function Image({ src, alt = '', width, height, className, sizes = '100vw', priority = false, ...props }) {
  if (!src) return null;
  const isWixMedia = /wixstatic|wixmp|static\.wixstatic/.test(src);
  const srcSet = isWixMedia
    ? [480, 768, 1200, 1800].map((w) => `${withWidth(src, w)} ${w}w`).join(', ')
    : undefined;

  return (
    <img
      src={isWixMedia ? withWidth(src, width || 1200) : src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('block max-w-full', className)}
      {...props}
    />
  );
}

function withWidth(src, w) {
  try {
    const url = new URL(src, window.location.origin);
    url.searchParams.set('w', String(w));
    url.searchParams.set('fm', 'webp');
    return url.toString();
  } catch {
    return src;
  }
}

export default Image;

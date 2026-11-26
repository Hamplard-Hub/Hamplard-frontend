'use client';

import React, { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// A tiny purple-toned image encoded as a base64 data URL. Used as the blur
// placeholder while the real image loads.
export const DEFAULT_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAHklEQVQI12NgYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==';

export interface SmartImageProps extends Omit<ImageProps, 'src'> {
  /** Image source. Empty/null values render the fallback immediately. */
  src: ImageProps['src'] | null | undefined;
  /** Optional image to try when `src` fails to load. */
  fallbackSrc?: ImageProps['src'];
  /** Content rendered when no image can be shown (missing or broken). */
  fallback?: React.ReactNode;
  /** Extra classes for the default broken-image state. */
  fallbackClassName?: string;
}

type Stage = 'primary' | 'fallbackSrc' | 'broken';

/**
 * Wrapper around `next/image` that shows a blur placeholder while loading,
 * fades the image in once it has loaded, retries with `fallbackSrc` when the
 * source is broken and finally renders a graceful fallback state.
 */
export function SmartImage({
  src,
  fallbackSrc,
  fallback,
  fallbackClassName,
  alt,
  className,
  placeholder,
  blurDataURL,
  onError,
  onLoad,
  fill,
  width,
  height,
  ...props
}: SmartImageProps) {
  const [stage, setStage] = useState<Stage>(src ? 'primary' : fallbackSrc ? 'fallbackSrc' : 'broken');
  const [loaded, setLoaded] = useState(false);

  // Reset when the source changes (e.g. a card is reused for another course).
  useEffect(() => {
    setStage(src ? 'primary' : fallbackSrc ? 'fallbackSrc' : 'broken');
    setLoaded(false);
  }, [src, fallbackSrc]);

  if (stage === 'broken') {
    if (fallback !== undefined) return <>{fallback}</>;

    return (
      <div
        role="img"
        aria-label={alt || 'Image unavailable'}
        className={cn(
          'flex items-center justify-center bg-ink-50 text-ink-300',
          fill ? 'absolute inset-0' : undefined,
          fallbackClassName,
        )}
        style={fill ? undefined : { width, height }}
      >
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  const currentSrc = stage === 'primary' ? src! : fallbackSrc!;
  const isDataUrl = typeof currentSrc === 'string' && currentSrc.startsWith('data:');

  return (
    <Image
      {...props}
      key={stage}
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      placeholder={placeholder ?? (isDataUrl ? 'empty' : 'blur')}
      blurDataURL={blurDataURL ?? DEFAULT_BLUR_DATA_URL}
      className={cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-90', className)}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setLoaded(false);
        setStage((current) => (current === 'primary' && fallbackSrc ? 'fallbackSrc' : 'broken'));
        onError?.(event);
      }}
    />
  );
}

export default SmartImage;

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Matches devices whose primary pointer is accurate (mouse / trackpad) and
 * that can hover. Touch-primary devices (phones, tablets) do NOT match,
 * so they never fire a prefetch.
 */
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/** How long the pointer must rest on an element before its route is prefetched. */
const DEFAULT_DELAY_MS = 200;

interface UseHoverPrefetchOptions {
  /**
   * Hover duration required before the prefetch fires. Guards against
   * wasted requests when the pointer merely passes over an element.
   * Defaults to 200ms.
   */
  delayMs?: number;
}

interface UseHoverPrefetchResult {
  /** Call from (or spread onto) the element's `onMouseEnter` — schedules the delayed prefetch. */
  onMouseEnter: () => void;
  /** Call from (or spread onto) the element's `onMouseLeave` — cancels a pending prefetch. */
  onMouseLeave: () => void;
}

/**
 * useHoverPrefetch
 *
 * Delays a `router.prefetch(href)` until the pointer has rested on an
 * element for `delayMs` (default 200ms). If the pointer leaves before the
 * delay elapses, the pending prefetch is cancelled, so quick pass-overs
 * never trigger a network request. Prefetching is limited to devices with
 * an accurate pointer (not touch).
 *
 * @example
 * const { onMouseEnter, onMouseLeave } = useHoverPrefetch(`/courses/${course.id}`);
 * return <Link href={`/courses/${course.id}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>…</Link>;
 */
export function useHoverPrefetch(
  href: string | null | undefined,
  { delayMs = DEFAULT_DELAY_MS }: UseHoverPrefetchOptions = {},
): UseHoverPrefetchResult {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whether the current device has an accurate, hover-capable pointer.
  // Kept in a ref (not state): it never affects rendered output, only
  // whether a prefetch fires, so updating it must not re-render.
  const hasFinePointerRef = useRef(false);

  useEffect(() => {
    // matchMedia is unavailable during SSR and in some test environments.
    // Treat those as "no pointer device" — hover prefetching never applies.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      hasFinePointerRef.current = false;
      return;
    }

    const mediaQuery = window.matchMedia(FINE_POINTER_QUERY);
    hasFinePointerRef.current = mediaQuery.matches;

    // Re-evaluate when the primary input changes (e.g. a mouse attached to
    // a tablet, or a 2-in-1 switching to tablet mode).
    const handleChange = (event: MediaQueryListEvent) => {
      hasFinePointerRef.current = event.matches;
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const onMouseEnter = useCallback(() => {
    // Touch devices (and environments without matchMedia) never prefetch.
    if (!hasFinePointerRef.current || !href) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      router.prefetch(href);
    }, delayMs);
  }, [href, delayMs, router]);

  const onMouseLeave = useCallback(() => {
    // Cancel the pending prefetch when the pointer leaves early.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Never fire a prefetch for a component that unmounted mid-hover.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { onMouseEnter, onMouseLeave };
}

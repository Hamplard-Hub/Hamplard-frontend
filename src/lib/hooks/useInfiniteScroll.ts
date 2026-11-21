import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  /** Called when the sentinel enters the viewport. Only fires when not already loading. */
  onLoadMore: () => void;
  /** Pass `true` while a fetch is in-flight to prevent duplicate requests. */
  loading: boolean;
  /** Pass `false` once the last page has been fetched to stop observing. */
  hasMore: boolean;
  /** Root margin – how far before the sentinel hits the viewport edge to trigger (default 200px). */
  rootMargin?: string;
}

/**
 * useInfiniteScroll
 *
 * Returns a `sentinelRef` that you attach to a bottom-of-list element.
 * When that element comes within `rootMargin` of the viewport and
 * `loading` is false and `hasMore` is true, `onLoadMore` is called.
 *
 * @example
 * const { sentinelRef } = useInfiniteScroll({ onLoadMore: fetchNext, loading, hasMore });
 * return (
 *   <>
 *     {courses.map(c => <CourseCard key={c.id} course={c} />)}
 *     <div ref={sentinelRef} />
 *   </>
 * );
 */
export function useInfiniteScroll({
  onLoadMore,
  loading,
  hasMore,
  rootMargin = '200px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Keep a stable reference to the callback so the observer closure stays fresh
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasMore) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  // Re-create observer only when loading/hasMore change so it picks up the
  // latest guard values, without needing the callback in the dep array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, rootMargin]);

  return { sentinelRef };
}

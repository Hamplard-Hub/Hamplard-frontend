'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CourseCard } from './CourseCard';
import { CourseCardSkeleton } from './CourseCardSkeleton';
import type { Course } from '@/types';

interface Props {
  courses: Course[];
  loading?: boolean;
  skeletons?: number;
  /**
   * Number of cards in the above-the-fold row. Those cards get priority loading;
   * the rest are lazy-loaded. Defaults to 4 (matches the 4-column max-width grid).
   */
  aboveFoldCount?: number;
  /**
   * Extra rows rendered above and below the viewport to avoid flicker while
   * scrolling. Defaults to 2.
   */
  overscanRows?: number;
  /**
   * Estimated height of a single card row in pixels. Used to compute the
   * virtual window before real measurements are available. Defaults to 320.
   */
  estimatedRowHeight?: number;
}

/**
 * Resolve the number of grid columns for the current viewport width.
 * Mirrors the Tailwind breakpoints used by the grid classes below:
 * grid-cols-1 md:grid-cols-2 lg:grid-cols-4
 */
function getColumnCount(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 768) return 2;
  return 1;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function CourseCardGrid({
  courses,
  loading = false,
  skeletons = 8,
  aboveFoldCount = 4,
  overscanRows = 2,
  estimatedRowHeight = 320,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(1);
  const [rowHeight, setRowHeight] = useState(estimatedRowHeight);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Track the responsive column count so the virtual window matches the grid.
  useIsomorphicLayoutEffect(() => {
    const updateColumns = () => setColumns(getColumnCount(window.innerWidth));
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Measure the real row height from the first rendered card so the window
  // stays accurate and no layout shift occurs while scrolling.
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const firstCard = container.querySelector<HTMLElement>('[data-course-card]');
    if (firstCard) {
      const measured = firstCard.getBoundingClientRect().height;
      if (measured > 0 && Math.abs(measured - rowHeight) > 1) {
        setRowHeight(measured);
      }
    }
  }, [courses, columns, rowHeight]);

  // Track the scroll position of the nearest scrollable ancestor (or window).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getScrollParent = (): HTMLElement | Window => {
      let parent = container.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (/(auto|scroll|overlay)/.test(style.overflowY)) return parent;
        parent = parent.parentElement;
      }
      return window;
    };

    const scrollParent = getScrollParent();

    const readScroll = () => {
      if (scrollParent === window) {
        setScrollTop(window.scrollY);
        setViewportHeight(window.innerHeight);
      } else {
        const el = scrollParent as HTMLElement;
        setScrollTop(el.scrollTop);
        setViewportHeight(el.clientHeight);
      }
    };

    readScroll();
    scrollParent.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    return () => {
      scrollParent.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
    };
  }, []);

  const totalItems = loading ? skeletons : courses.length;
  const rowCount = Math.ceil(totalItems / columns);
  const totalHeight = rowCount * rowHeight;

  const { startRow, endRow } = useMemo(() => {
    const container = containerRef.current;
    const containerTop = container ? container.getBoundingClientRect().top + scrollTop : 0;
    const relativeScroll = Math.max(0, scrollTop - containerTop);
    const firstVisible = Math.floor(relativeScroll / rowHeight);
    const visibleRows = Math.ceil((viewportHeight || rowHeight) / rowHeight);
    const start = Math.max(0, firstVisible - overscanRows);
    const end = Math.min(rowCount, firstVisible + visibleRows + overscanRows);
    return { startRow: start, endRow: end };
  }, [scrollTop, viewportHeight, rowHeight, rowCount, overscanRows]);

  const startIndex = startRow * columns;
  const endIndex = Math.min(totalItems, endRow * columns);

  const visibleItems = useMemo(() => {
    if (loading) {
      return Array.from({ length: Math.max(0, endIndex - startIndex) }, (_, i) => startIndex + i);
    }
    return courses.slice(startIndex, endIndex);
  }, [loading, courses, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: totalHeight }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{
          position: 'absolute',
          top: startRow * rowHeight,
          left: 0,
          right: 0,
        }}
      >
        {loading
          ? visibleItems.map((i) => <CourseCardSkeleton key={i} />)
          : (visibleItems as Course[]).map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                priority={startIndex + index < aboveFoldCount}
              />
            ))}
      </div>
    </div>
  );
}

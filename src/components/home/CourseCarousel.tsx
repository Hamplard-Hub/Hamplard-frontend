'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseCardSkeleton } from '@/components/skeletons';
import type { Course } from '@/types';

interface CourseCarouselProps {
  /** Section heading, e.g. "Bestsellers" */
  title: string;
  /** Optional short line under the heading */
  subtitle?: string;
  /** "See all" destination — usually a pre-filtered /courses URL */
  seeAllHref: string;
  courses: Course[];
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  /** Enable autoplay of the carousel. Defaults to false. */
  autoplay?: boolean;
  /** Autoplay interval in ms. Defaults to 4000. */
  autoplayInterval?: number;
}

const CARD_WIDTH_CLASS = 'w-[72vw] max-w-[280px] sm:w-[264px]';
const GAP_PX = 16; // matches gap-4
const SWIPE_THRESHOLD_PX = 40;

export function CourseCarousel({
  title,
  subtitle,
  seeAllHref,
  courses,
  loading = false,
  skeletonCount = 4,
  emptyMessage = 'No courses to show here yet.',
  autoplay = false,
  autoplayInterval = 4000,
}: CourseCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  // Autoplay pauses on hover, reduced motion, or direct interaction until resumed.
  const [isHovering, setIsHovering] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  // Touch swipe tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const itemCount = loading ? skeletonCount : courses.length;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < maxScroll - 4);

    const step = (firstItemRef.current?.offsetWidth ?? el.clientWidth) + GAP_PX;
    if (step > 0) {
      const index = Math.round(el.scrollLeft / step);
      setActiveDot(Math.min(index, Math.max(itemCount - 1, 0)));
    }
  }, [itemCount]);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [updateScrollState, courses.length, loading]);

  // Reset scroll position whenever the underlying list changes (e.g. after loading finishes)
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [loading, courses]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (firstItemRef.current?.offsetWidth ?? el.clientWidth) + GAP_PX;
    el.scrollBy({ left: step * direction, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [prefersReducedMotion]);

  const scrollToDot = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (firstItemRef.current?.offsetWidth ?? el.clientWidth) + GAP_PX;
    el.scrollTo({ left: step * index, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [prefersReducedMotion]);

  // Manual interaction stops autoplay until the user explicitly resumes it.
  const markUserInteracted = useCallback(() => {
    setUserInteracted(true);
  }, []);

  const handleArrowClick = useCallback(
    (direction: 1 | -1) => {
      markUserInteracted();
      scrollByCard(direction);
    },
    [markUserInteracted, scrollByCard],
  );

  const handleDotClick = useCallback(
    (index: number) => {
      markUserInteracted();
      scrollToDot(index);
    },
    [markUserInteracted, scrollToDot],
  );

  const handleScrollerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        handleArrowClick(event.key === 'ArrowLeft' ? -1 : 1);
      }
    },
    [handleArrowClick],
  );

  const handleAutoplayToggle = useCallback(() => {
    if (isPausedByUser || userInteracted) {
      setIsPausedByUser(false);
      setUserInteracted(false);
    } else {
      setIsPausedByUser(true);
    }
  }, [isPausedByUser, userInteracted]);

  // Autoplay: advance one card at a time, looping back to the start.
  useEffect(() => {
    if (!autoplay || loading || userInteracted || isPausedByUser || isHovering || prefersReducedMotion) return;
    if (courses.length <= 1) return;

    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const step = (firstItemRef.current?.offsetWidth ?? el.clientWidth) + GAP_PX;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, autoplayInterval);

    return () => window.clearInterval(id);
  }, [autoplay, autoplayInterval, loading, userInteracted, isPausedByUser, isHovering, prefersReducedMotion, courses.length]);

  // Touch swipe handlers — horizontal swipes navigate, vertical swipes scroll the page.
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null || startY === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Ignore mostly-vertical gestures so page scrolling still works.
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;

    markUserInteracted();
    scrollByCard(deltaX < 0 ? 1 : -1);
  }

  const showArrows = !loading && courses.length > 0 && (canScrollPrev || canScrollNext);
  const showDots = !loading && courses.length > 1;
  const autoplayPaused = isPausedByUser || userInteracted;

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label={title}
      onFocusCapture={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.hasAttribute('data-carousel-rotation-control')
        ) {
          return;
        }
        setUserInteracted(true);
      }}
    >
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="section-heading">{title}</h2>
          {subtitle && <p className="text-sm text-ink-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {autoplay && courses.length > 1 && !loading && (
            <button
              type="button"
              data-carousel-rotation-control
              onClick={handleAutoplayToggle}
              disabled={prefersReducedMotion}
              aria-label={
                prefersReducedMotion
                  ? 'Automatic slide rotation is disabled by your reduced motion preference'
                  : autoplayPaused
                    ? 'Resume automatic slide rotation'
                    : 'Pause automatic slide rotation'
              }
              aria-pressed={autoplayPaused}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:bg-hamplard-lilac focus:outline-none focus:ring-2 focus:ring-hamplard-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {autoplayPaused
                ? <Play className="h-4 w-4" aria-hidden="true" />
                : <Pause className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
          <Link
            href={seeAllHref}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-hamplard-primary transition-colors hover:text-hamplard-deep"
          >
            See all
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Desktop arrows */}
        {showArrows && (
          <>
            <button
              type="button"
              onClick={() => handleArrowClick(-1)}
              disabled={!canScrollPrev}
              aria-label={`Scroll ${title} left`}
              className={cn(
                'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
                'w-11 h-11 items-center justify-center rounded-full bg-white shadow-md border border-ink-100',
                'transition-opacity hover:bg-hamplard-lilac focus:outline-none focus:ring-2 focus:ring-hamplard-primary',
                !canScrollPrev && 'opacity-0 pointer-events-none',
              )}
            >
              <ChevronLeft className="w-5 h-5 text-hamplard-deep" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleArrowClick(1)}
              disabled={!canScrollNext}
              aria-label={`Scroll ${title} right`}
              className={cn(
                'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10',
                'w-11 h-11 items-center justify-center rounded-full bg-white shadow-md border border-ink-100',
                'transition-opacity hover:bg-hamplard-lilac focus:outline-none focus:ring-2 focus:ring-hamplard-primary',
                !canScrollNext && 'opacity-0 pointer-events-none',
              )}
            >
              <ChevronRight className="w-5 h-5 text-hamplard-deep" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Scroll row */}
        {!loading && courses.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-ink-400">{emptyMessage}</p>
          </div>
        ) : (
          <div
            ref={scrollerRef}
            role="group"
            aria-label={`${title} carousel slides`}
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleScrollerKeyDown}
            className={cn(
              'flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1',
              !prefersReducedMotion && 'scroll-smooth',
            )}
          >
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => (
                  <div
                    key={i}
                    ref={i === 0 ? firstItemRef : undefined}
                    className={cn(CARD_WIDTH_CLASS, 'shrink-0 snap-start')}
                  >
                    <CourseCardSkeleton />
                  </div>
                ))
              : courses.map((course, i) => (
                  <div
                    key={course.id}
                    ref={i === 0 ? firstItemRef : undefined}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`Slide ${i + 1} of ${courses.length}: ${course.title}`}
                    className={cn(CARD_WIDTH_CLASS, 'shrink-0 snap-start')}
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
          </div>
        )}

        {/* Mobile dots */}
        {showDots && (
          <div className="flex md:hidden items-center justify-center gap-2 mt-4" role="group" aria-label={`${title} slide navigation`}>
            {courses.map((course, i) => (
              <button
                key={course.id}
                type="button"
                aria-current={i === activeDot ? 'true' : undefined}
                aria-label={`Go to slide ${i + 1} of ${courses.length}`}
                onClick={() => handleDotClick(i)}
                className="flex h-11 w-11 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    i === activeDot ? 'w-5 bg-hamplard-primary' : 'w-1.5 bg-ink-200',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
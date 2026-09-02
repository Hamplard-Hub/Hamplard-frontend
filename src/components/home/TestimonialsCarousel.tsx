'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  courseTaken: string;
  quote: string;
  rating: number; // 1-5
  avatarUrl?: string | null;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  /** Auto-advance interval in milliseconds. Default: 5000ms (5 seconds) */
  autoAdvanceInterval?: number;
  /** Optional heading above the carousel */
  heading?: string;
  /** Optional subtitle below heading */
  subtitle?: string;
}

// ── Initials Avatar ───────────────────────────────────────────────

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
      {initials}
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const clampedRating = Math.min(5, Math.max(0, rating));
  
  return (
    <div className="flex items-center gap-0.5" aria-label={`${clampedRating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= Math.round(clampedRating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-200'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────────

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="card p-6 h-full flex flex-col bg-white hover:shadow-lifted transition-shadow duration-200">
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-saffron-200 mb-4" aria-hidden="true" />
      
      {/* Quote text */}
      <blockquote className="text-sm sm:text-base text-ink-700 leading-relaxed mb-6 flex-1">
        "{testimonial.quote}"
      </blockquote>
      
      {/* Author info */}
      <div className="flex items-center gap-3 pt-4 border-t border-ink-100">
        {testimonial.avatarUrl ? (
          <img
            src={testimonial.avatarUrl}
            alt={`${testimonial.name} avatar`}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <InitialsAvatar name={testimonial.name} />
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900 truncate">{testimonial.name}</p>
          <p className="text-xs text-ink-500 truncate">{testimonial.role}</p>
          <p className="text-xs text-saffron-600 font-medium truncate mt-0.5">
            {testimonial.courseTaken}
          </p>
          <div className="mt-1.5">
            <StarRating rating={testimonial.rating} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Carousel Component ───────────────────────────────────────

export function TestimonialsCarousel({
  testimonials,
  autoAdvanceInterval = 5000,
  heading = 'What Our Students Say',
  subtitle = 'Real stories from learners who transformed their skills on Hamplard',
}: TestimonialsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalTestimonials = testimonials.length;
  
  // Determine how many cards to show at once based on screen (handled by CSS grid)
  // Desktop: 3, Mobile: 1
  const itemsPerPage = 3; // Max visible on desktop
  const totalDots = Math.ceil(totalTestimonials / itemsPerPage);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-advance logic
  useEffect(() => {
    // Don't auto-advance if:
    // - User prefers reduced motion
    // - Carousel is paused (hover)
    // - Less than 2 testimonials
    if (prefersReducedMotion || isPaused || totalTestimonials < 2) {
      return;
    }

    autoAdvanceTimerRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % totalTestimonials);
    }, autoAdvanceInterval);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [activeIndex, isPaused, prefersReducedMotion, totalTestimonials, autoAdvanceInterval]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalTestimonials) % totalTestimonials);
  }, [totalTestimonials]);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalTestimonials);
  }, [totalTestimonials]);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    },
    [goToPrevious, goToNext]
  );

  if (totalTestimonials === 0) {
    return null;
  }

  return (
    <section
      className="py-12 sm:py-16"
      aria-label="Student testimonials"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="section-heading mb-2">{heading}</h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-ink-500 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Previous Button */}
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous testimonial"
            className={cn(
              'hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
              'w-10 h-10 sm:w-12 sm:h-12 items-center justify-center rounded-full',
              'bg-white shadow-md border border-ink-100',
              'transition-all hover:bg-hamplard-lilac hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:ring-offset-2'
            )}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-hamplard-deep" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next testimonial"
            className={cn(
              'hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10',
              'w-10 h-10 sm:w-12 sm:h-12 items-center justify-center rounded-full',
              'bg-white shadow-md border border-ink-100',
              'transition-all hover:bg-hamplard-lilac hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:ring-offset-2'
            )}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-hamplard-deep" />
          </button>

          {/* Mobile Arrows */}
          <div className="flex lg:hidden items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous testimonial"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-ink-200 hover:bg-hamplard-lilac transition-colors focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
            >
              <ChevronLeft className="w-5 h-5 text-hamplard-deep" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next testimonial"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-ink-200 hover:bg-hamplard-lilac transition-colors focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
            >
              <ChevronRight className="w-5 h-5 text-hamplard-deep" />
            </button>
          </div>

          {/* Testimonials Grid */}
          <div className="overflow-hidden">
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${activeIndex * (100 / itemsPerPage)}%)`,
              }}
              role="region"
              aria-live="polite"
              aria-atomic="true"
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          {/* Dot Navigation */}
          {totalTestimonials > 1 && (
            <div
              className="flex items-center justify-center gap-2 mt-8"
              role="tablist"
              aria-label="Testimonial navigation"
            >
              {testimonials.map((testimonial, index) => (
                <button
                  key={testimonial.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Go to testimonial ${index + 1}`}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    'focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:ring-offset-2',
                    index === activeIndex
                      ? 'w-8 h-2 bg-hamplard-primary'
                      : 'w-2 h-2 bg-ink-200 hover:bg-ink-300'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status indicator (for accessibility and debugging) */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Showing testimonial {activeIndex + 1} of {totalTestimonials}
        </div>
      </div>
    </section>
  );
}

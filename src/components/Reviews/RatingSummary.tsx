'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RatingDistribution } from '@/types';

interface RatingSummaryProps {
  /** Overall average rating (e.g. 4.6) */
  averageRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Per-star counts, one entry per star value 1–5 */
  distribution: RatingDistribution[];
  /** Optional: highlighted star bar (e.g. from filter click) */
  highlightedStar?: number | null;
  /** Callback when a distribution row is clicked for filtering */
  onStarFilter?: (star: number | null) => void;
  className?: string;
}

/** Render 5 stars clamped to `filled` fraction (supports half-stars via clip-path). */
function StarRow({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const cls = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = Math.min(1, Math.max(0, rating - (s - 1)));
        const isFullyFilled = filled >= 0.9;
        const isPartiallyFilled = filled > 0.1 && filled < 0.9;

        return (
          <span key={s} className="relative inline-block">
            {/* Empty star */}
            <Star className={cn(cls, 'text-gray-200')} />
            {/* Filled overlay — clip for partial fill */}
            {(isFullyFilled || isPartiallyFilled) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${filled * 100}%` }}
              >
                <Star className={cn(cls, 'fill-amber-400 text-amber-400')} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * RatingSummary
 *
 * Displays the overall star score on the left and a 5→1 star distribution
 * bar chart on the right. Each bar row is clickable to apply a star filter.
 *
 * States:
 *  - Default: all bars shown at their natural fill levels.
 *  - Filtered: highlighted star bar uses hamplard-primary fill; others are muted.
 */
export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
  highlightedStar = null,
  onStarFilter,
  className,
}: RatingSummaryProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  // Sort descending: 5 → 1
  const sortedDist = [...distribution].sort((a, b) => b.stars - a.stars);

  function handleBarClick(star: number) {
    if (!onStarFilter) return;
    // Toggle off if same star clicked again
    onStarFilter(highlightedStar === star ? null : star);
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-semantic-border bg-semantic-bg-surface p-6',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

        {/* ── Left: Overall score ── */}
        <div className="flex flex-col items-center text-center shrink-0 min-w-[100px]">
          <span
            className="font-display text-5xl font-bold text-hamplard-deep tracking-tight leading-none"
            aria-label={`Average rating ${averageRating.toFixed(1)} out of 5`}
          >
            {averageRating.toFixed(1)}
          </span>

          <div className="mt-2">
            <StarRow rating={averageRating} size="md" />
          </div>

          <p className="mt-1.5 text-xs text-semantic-text-muted font-medium">
            {totalReviews.toLocaleString()}{' '}
            {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden sm:block h-24 w-px bg-semantic-border shrink-0" />

        {/* ── Right: Distribution bars ── */}
        <div className="flex-1 w-full space-y-1.5" role="list" aria-label="Rating distribution">
          {sortedDist.map(({ stars, count }) => {
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const reviewPct =
              totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const isHighlighted = highlightedStar === stars;
            const isActive = !!onStarFilter; // clickable?

            return (
              <div
                key={stars}
                role="listitem"
                onClick={() => handleBarClick(stars)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBarClick(stars);
                  }
                }}
                tabIndex={isActive ? 0 : undefined}
                aria-label={`${stars} stars — ${count} reviews (${reviewPct}%)${isHighlighted ? ', currently filtered' : ''}`}
                className={cn(
                  'group flex items-center gap-2.5 py-0.5 rounded-lg transition-colors',
                  isActive && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-offset-1',
                  isActive && !isHighlighted && 'hover:bg-hamplard-lilac/40 px-1 -mx-1',
                  isHighlighted && 'bg-hamplard-lilac px-1 -mx-1',
                )}
              >
                {/* Star label */}
                <span className="text-xs font-semibold text-hamplard-deep w-5 text-right shrink-0">
                  {stars}
                </span>

                {/* Mini star icon */}
                <Star
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-colors',
                    isHighlighted
                      ? 'fill-hamplard-primary text-hamplard-primary'
                      : 'fill-amber-400 text-amber-400',
                  )}
                  aria-hidden="true"
                />

                {/* Bar track */}
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isHighlighted
                        ? 'bg-hamplard-primary'
                        : highlightedStar !== null
                        ? 'bg-hamplard-primary/30'
                        : 'bg-hamplard-primary/70',
                    )}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={reviewPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

                {/* Count */}
                <span
                  className={cn(
                    'text-xs w-7 text-right shrink-0 tabular-nums transition-colors',
                    isHighlighted ? 'text-hamplard-mid font-semibold' : 'text-semantic-text-muted',
                  )}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active filter badge ── */}
      {highlightedStar !== null && onStarFilter && (
        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-semantic-border">
          <span className="text-xs text-semantic-text-muted">Filtering by:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-hamplard-primary text-white text-xs font-semibold">
            <Star className="w-3 h-3 fill-white" aria-hidden="true" />
            {highlightedStar} star{highlightedStar !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => onStarFilter(null)}
            className="ml-auto text-xs text-hamplard-primary hover:text-hamplard-mid hover:underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary rounded"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

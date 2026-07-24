'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RatingSummary } from './RatingSummary';
import { ReviewCard } from './ReviewCard';
import { ReviewFilter } from './ReviewFilter';
import { ReviewForm } from './ReviewForm';
import type { Review, ReviewSortOption, RatingDistribution } from '@/types';

interface ReviewSectionProps {
  courseId: string;
  courseName: string;
  reviews: Review[];
  averageRating: number;
  /** Whether the current viewer is enrolled and can submit a review */
  canReview?: boolean;
  /** If the viewer has already reviewed, pass their existing review */
  existingReview?: {
    rating: number;
    text: string;
    authorName: string;
    date: string;
  };
  onSubmitReview?: (rating: number, text: string) => Promise<void>;
  className?: string;
}

/**
 * ReviewSection
 *
 * Full-page review block for course detail pages. Composes:
 *  - RatingSummary  (overall score + bar chart, with clickable star filter)
 *  - ReviewFilter   (sort by most-recent / helpful / highest / lowest)
 *  - ReviewCard[]   (review list, filtered + sorted)
 *  - ReviewForm     (for enrolled students who can leave/edit a review)
 *
 * All state is local. In production, replace the derived `distribution` with
 * data from the API and wire `onSubmitReview` to your backend call.
 */
export function ReviewSection({
  courseName,
  reviews,
  averageRating,
  canReview = false,
  existingReview,
  onSubmitReview,
  className,
}: ReviewSectionProps) {
  const [sortBy, setSortBy] = useState<ReviewSortOption>('most_recent');
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Derive distribution from reviews list
  const distribution = useMemo<RatingDistribution[]>(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return [1, 2, 3, 4, 5].map((stars) => ({ stars, count: counts[stars] ?? 0 }));
  }, [reviews]);

  // Filter by star
  const filtered = useMemo(
    () => (starFilter !== null ? reviews.filter((r) => Math.round(r.rating) === starFilter) : reviews),
    [reviews, starFilter],
  );

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sortBy) {
      case 'most_recent':
        return copy.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case 'most_helpful':
        return copy.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
      case 'highest_rated':
        return copy.sort((a, b) => b.rating - a.rating);
      case 'lowest_rated':
        return copy.sort((a, b) => a.rating - b.rating);
      default:
        return copy;
    }
  }, [filtered, sortBy]);

  const totalReviews = reviews.length;

  return (
    <section
      className={cn('space-y-8', className)}
      aria-label="Course reviews"
    >
      {/* ── Section heading ── */}
      <h2 className="font-display text-h4 text-hamplard-deep">Reviews</h2>

      {/* ── Rating summary ── */}
      {totalReviews > 0 && (
        <RatingSummary
          averageRating={averageRating}
          totalReviews={totalReviews}
          distribution={distribution}
          highlightedStar={starFilter}
          onStarFilter={setStarFilter}
        />
      )}

      {/* ── Review submission form (enrolled students only) ── */}
      {canReview && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-hamplard-deep">
            {existingReview ? 'Your Review' : 'Leave a Review'}
          </h3>
          <ReviewForm
            courseName={courseName}
            existingReview={existingReview}
            onSubmit={onSubmitReview}
          />
        </div>
      )}

      {/* ── Review list ── */}
      {totalReviews > 0 ? (
        <div className="space-y-4">
          {/* Filter / sort controls */}
          <ReviewFilter
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalReviews={sorted.length}
          />

          {/* Empty state when star filter yields no results */}
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-semantic-border bg-semantic-bg-surface p-10 text-center">
              <p className="text-sm text-semantic-text-muted">
                No {starFilter}-star reviews yet.{' '}
                <button
                  type="button"
                  onClick={() => setStarFilter(null)}
                  className="text-hamplard-primary hover:underline underline-offset-2 font-medium"
                >
                  Clear filter
                </button>
              </p>
            </div>
          ) : (
            <ul className="space-y-4" aria-label="Review list">
              {sorted.map((review) => (
                <li key={review.id}>
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* Zero reviews state */
        <div className="rounded-2xl border border-semantic-border bg-semantic-bg-surface p-10 text-center">
          <p className="text-2xl mb-3" aria-hidden="true">⭐</p>
          <p className="text-sm font-medium text-hamplard-deep mb-1">No reviews yet</p>
          <p className="text-xs text-semantic-text-muted">
            {canReview
              ? 'Be the first to share your experience with this course.'
              : 'Enroll to be the first to review this course.'}
          </p>
        </div>
      )}
    </section>
  );
}

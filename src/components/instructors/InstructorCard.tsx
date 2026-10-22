'use client';

import Link from 'next/link';
import { BookOpen, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { instructorPath } from '@/lib/instructors';
import type { Instructor } from '@/types';

/** Two-letter fallback used when the instructor has no avatar. */
function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

/** Filled/empty star row for the instructor's average rating. */
function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            'w-3.5 h-3.5',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-ink-200',
          )}
        />
      ))}
    </div>
  );
}

interface InstructorCardProps {
  instructor: Instructor;
}

/**
 * InstructorCard
 *
 * A single instructor in the `/instructors` directory grid. The whole card is a
 * single link to the instructor's public profile — there is no nested
 * interactive element, so no stretched-overlay trick is needed here.
 */
export function InstructorCard({ instructor }: InstructorCardProps) {
  const { name, avatarUrl, headline, category, rating, reviewCount } = instructor;
  const hasRating = reviewCount > 0 && rating > 0;

  return (
    <Link
      href={instructorPath(instructor.id)}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      <article className="card h-full p-5 transition-all duration-200 group-hover:shadow-lifted group-hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name} avatar`}
              className="w-14 h-14 rounded-full object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-14 h-14 rounded-full bg-hamplard-lilac text-hamplard-deep font-display font-bold text-lg flex items-center justify-center shrink-0"
            >
              {initialsOf(name) || '?'}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-ink-900 truncate group-hover:text-hamplard-primary transition-colors">
              {name}
            </h3>
            {headline && (
              <p className="text-xs text-ink-500 truncate mt-0.5">{headline}</p>
            )}
            {category && (
              <span className="mt-2 inline-flex items-center rounded-lg bg-saffron-50 px-2.5 py-1 text-[11px] font-semibold text-saffron-700">
                {category}
              </span>
            )}
          </div>
        </div>

        {hasRating && (
          <div className="mt-4 flex items-center gap-2">
            <Stars rating={rating} />
            <span className="text-xs font-semibold text-ink-700">{rating.toFixed(1)}</span>
            <span className="text-xs text-ink-400">({reviewCount.toLocaleString()})</span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-ink-100 flex items-center gap-4 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            {instructor.totalStudents.toLocaleString()} students
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            {instructor.totalCourses.toLocaleString()} courses
          </span>
        </div>
      </article>
    </Link>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Heart, Star, Users } from 'lucide-react';
import {
  cn, courseTotalMins, formatUsdc, levelChip,
} from '@/lib/utils';
import type { Course } from '@/types';

type BadgeVariant = 'bestseller' | 'new' | 'hot';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  bestseller: 'bg-hamplard-lilac text-hamplard-deep',
  new:        'bg-hamplard-lilac text-hamplard-deep',
  hot:        'bg-orange-100 text-orange-700',
};

interface Props {
  course: Course;
  href?: string;
  showProgress?: number;
}

export function CourseCard({ course, href, showProgress }: Props) {
  const dest = href ?? `/dashboard/courses/${course.id}`;
  const mins = courseTotalMins(course.totalDuration ?? 0);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered]     = useState(false);
  const [showPreview, setShowPreview]  = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const badge        = course.badge as BadgeVariant | undefined;
  const rating       = course.rating != null ? Math.min(5, Math.max(0, course.rating)) : null;
  const reviewCount  = course.reviewCount ?? 0;
  const hasDiscount  = course.originalPrice != null && course.originalPrice > course.price;
  const discountPct  = hasDiscount ? Math.round((1 - course.price / course.originalPrice!) * 100) : 0;

  function handleMouseEnter() {
    setIsHovered(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPreview(true), 200);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setShowPreview(false);
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }

  function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
  }

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <Link href={dest} className="group block relative">
      <article
        className={cn(
          'card overflow-hidden transition-all duration-200',
          isHovered && 'shadow-lifted -translate-y-0.5',
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Thumbnail ── */}
        <div className="relative aspect-video bg-gradient-to-br from-saffron-100 to-saffron-200 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">
                {course.category === 'Tailoring'       ? '🧵' :
                 course.category === 'Baking'          ? '🍰' :
                 course.category === 'Photography'     ? '📷' :
                 course.category === 'Makeup Artistry' ? '💄' :
                 course.category === 'Hairstyling'     ? '💇' :
                 course.category === 'Nail Technology' ? '💅' : '🎓'}
              </span>
            </div>
          )}

          {/* Badge — top-left */}
          {badge && BADGE_STYLES[badge] && (
            <span className={cn(
              'absolute top-2.5 left-2.5 px-2.5 py-1 text-xs font-semibold rounded-full capitalize',
              BADGE_STYLES[badge],
            )}>
              {badge}
            </span>
          )}

          {/* Level chip (fallback when no badge) */}
          {!badge && (
            <div className="absolute top-2.5 left-2.5">
              <span className={levelChip(course.level)}>{course.level}</span>
            </div>
          )}

          {/* Wishlist heart — top-right */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-hamplard-primary"
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-colors',
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400',
              )}
            />
          </button>

          {/* Preview video overlay */}
          {course.previewVideoUrl && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-ink-800 ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-4">
          <p className="text-xs text-saffron-600 font-medium mb-1">{course.category}</p>
          <h3 className="text-sm font-semibold text-ink-900 mb-2 line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-ink-500 mb-3 truncate">
            {course.instructor?.name ?? 'Hamplard Instructor'}
          </p>

          {/* Star rating + review count */}
          {rating !== null && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3.5 h-3.5',
                      star <= Math.round(rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-ink-700">{rating.toFixed(1)}</span>
              <span className="text-xs text-ink-400">({reviewCount.toLocaleString()})</span>
            </div>
          )}

          {/* Stats row (shown when no rating available) */}
          {rating === null && (
            <div className="flex items-center gap-3 text-[11px] text-ink-400 mb-3">
              {mins > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                </span>
              )}
              {course.totalLessons > 0 && (
                <span>{course.totalLessons} lessons</span>
              )}
              {course._count?.enrollments > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {course._count.enrollments.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Progress bar (enrolled view) */}
          {showProgress !== undefined && (
            <div className="mb-3">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${showProgress}%` }} />
              </div>
              <p className="text-[10px] text-ink-400 mt-1">{showProgress}% complete</p>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-ink-900">
                {formatUsdc(course.price)}
                <span className="text-xs font-normal text-ink-400 ml-1">USDC</span>
              </span>
              {hasDiscount && course.originalPrice != null && (
                <>
                  <span className="text-sm text-ink-400 line-through">
                    {formatUsdc(course.originalPrice)}
                  </span>
                  <span className="text-xs font-semibold text-rose-600">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
            {course.status === 'ACTIVE' && (
              <span className="text-xs font-medium text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded-lg">
                Enroll now
              </span>
            )}
          </div>
        </div>
      </article>

      {/* ── Quick-preview tooltip ── */}
      {showPreview && course.description && (
        <div className="absolute left-0 right-0 top-full mt-2 p-3 bg-white rounded-lg shadow-lg border border-ink-100 z-20 animate-slide-up">
          <p className="text-sm text-ink-700 leading-relaxed line-clamp-3">
            {course.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
            {mins > 0 && (
              <span>{mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}</span>
            )}
            {course.totalLessons > 0 && <span>{course.totalLessons} lessons</span>}
            <span className="capitalize">{course.level}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

'use client';

import { ArrowUpDown, Clock, ThumbsUp, Star, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewSortOption } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface ReviewFilterProps {
  sortBy: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  /** Total count shown as contextual info */
  totalReviews?: number;
  className?: string;
}

const SORT_OPTIONS: {
  value: ReviewSortOption;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'most_recent',
    label: 'Most Recent',
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
  {
    value: 'most_helpful',
    label: 'Most Helpful',
    icon: <ThumbsUp className="w-4 h-4" aria-hidden="true" />,
  },
  {
    value: 'highest_rated',
    label: 'Highest Rated',
    icon: <Star className="w-4 h-4 fill-current" aria-hidden="true" />,
  },
  {
    value: 'lowest_rated',
    label: 'Lowest Rated',
    icon: <Star className="w-4 h-4" aria-hidden="true" />,
  },
];

/**
 * ReviewFilter
 *
 * Two layout variants in one component:
 *
 * - Mobile (< sm): A native `<select>` styled to match the design system, shown
 *   inside a pill-shaped container. Screen-reader friendly by default.
 *
 * - Desktop (≥ sm): Horizontal pill-button group. Each option is a toggle button.
 *   The active option uses hamplard-primary fill; inactive options use ghost style.
 *
 * A `totalReviews` count label is rendered to the left of the controls.
 */
export function ReviewFilter({
  sortBy,
  onSortChange,
  totalReviews,
  className,
}: ReviewFilterProps) {
  const activeLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [mobileOpen]);

  return (
    <div
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
      role="toolbar"
      aria-label="Review sort options"
    >
      {/* ── Review count ── */}
      {totalReviews !== undefined && (
        <p className="text-sm font-medium text-hamplard-deep">
          <span className="font-semibold">{totalReviews.toLocaleString()}</span>{' '}
          {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      )}

      {/* ── Mobile dropdown (< sm) ── */}
      <div className="relative sm:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={mobileOpen}
          aria-label={`Sort reviews by: ${activeLabel}`}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-2 rounded-pill border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary',
            'bg-white border-semantic-border text-hamplard-deep hover:bg-hamplard-lilac hover:border-hamplard-primary',
          )}
        >
          <ArrowUpDown className="w-4 h-4 text-hamplard-primary shrink-0" aria-hidden="true" />
          <span>{activeLabel}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 shrink-0 text-semantic-text-muted transition-transform duration-150',
              mobileOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown list */}
        {mobileOpen && (
          <ul
            role="listbox"
            aria-label="Sort options"
            className="absolute right-0 mt-1.5 w-48 py-1 rounded-xl border border-semantic-border bg-white shadow-lg z-10 animate-fade-in"
          >
            {SORT_OPTIONS.map((opt) => (
              <li key={opt.value} role="option" aria-selected={sortBy === opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onSortChange(opt.value);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
                    sortBy === opt.value
                      ? 'bg-hamplard-lilac text-hamplard-primary font-semibold'
                      : 'text-hamplard-deep hover:bg-hamplard-lilac/50',
                  )}
                >
                  <span
                    className={cn(
                      sortBy === opt.value ? 'text-hamplard-primary' : 'text-semantic-text-muted',
                    )}
                  >
                    {opt.icon}
                  </span>
                  {opt.label}
                  {sortBy === opt.value && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-hamplard-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Desktop pill-button group (≥ sm) ── */}
      <div
        className="hidden sm:flex items-center gap-1 p-1 rounded-pill bg-semantic-bg-surface border border-semantic-border"
        role="group"
        aria-label="Sort reviews"
      >
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSortChange(opt.value)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-offset-1',
                isActive
                  ? 'bg-hamplard-primary text-white shadow-sm'
                  : 'text-hamplard-deep/70 hover:text-hamplard-deep hover:bg-white',
              )}
            >
              <span
                className={cn(
                  'transition-colors',
                  isActive ? 'text-white' : 'text-semantic-text-muted',
                )}
              >
                {opt.icon}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

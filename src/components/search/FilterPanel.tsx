'use client';

import React from 'react';
import { ChevronDown, Star } from 'lucide-react';
import {
  useSearchStore,
  DURATION_BUCKETS,
  durationToBucket,
  DEFAULT_PRICE_RANGE,
  type SortOption,
  type PriceRange,
} from '@/lib/hooks/use-search-store';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const RATING_OPTIONS = [
  { value: 4.5, label: '4.5 & up' },
  { value: 4.0, label: '4.0 & up' },
  { value: 3.0, label: '3.0 & up' },
  { value: 0, label: 'Any rating' },
];

// Prices are stored in cents (e.g. 4999 → ₦49.99 equivalent minor unit).
const PRICE_OPTIONS: { label: string; range: PriceRange }[] = [
  { label: 'All prices', range: DEFAULT_PRICE_RANGE },
  { label: 'Free', range: { min: 0, max: 0 } },
  { label: 'Under ₦40', range: { min: 1, max: 4000 } },
  { label: '₦40 – ₦50', range: { min: 4000, max: 5000 } },
  { label: 'Over ₦50', range: { min: 5000, max: null } },
];

function priceRangesEqual(a: PriceRange, b: PriceRange) {
  return a.min === b.min && a.max === b.max;
}

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
}

function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="border-b border-ink-100 pb-6 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-ink-900">{title}</h3>
      {children}
    </div>
  );
}

interface FilterPanelProps {
  courses: Course[];
  /** Hide the sort control (e.g. when sort lives elsewhere on the page). */
  showSort?: boolean;
  className?: string;
}

export function FilterPanel({ courses, showSort = true, className }: FilterPanelProps) {
  const {
    sortBy,
    setSortBy,
    selectedCategories,
    toggleCategory,
    selectedLevels,
    toggleLevel,
    selectedDurations,
    toggleDuration,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
  } = useSearchStore();

  const categories = Array.from(new Set(courses.map((c) => c.category)));
  const levels = Array.from(new Set(courses.map((c) => c.level)));

  const countByCategory = (category: string) =>
    courses.filter((c) => c.category === category).length;
  const countByLevel = (level: string) => courses.filter((c) => c.level === level).length;
  const countByDuration = (bucket: string) =>
    courses.filter((c) => durationToBucket(c.totalDuration) === bucket).length;

  return (
    <div className={cn('space-y-6', className)}>
      {showSort && (
        <FilterGroup title="Sort By">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort results"
              className="w-full cursor-pointer appearance-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Category">
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 transition-colors hover:text-hamplard-primary"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="h-4 w-4 cursor-pointer rounded accent-hamplard-primary"
              />
              <span className="flex-1">{category}</span>
              <span className="text-xs text-ink-400">{countByCategory(category)}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Level">
        <div className="space-y-2">
          {levels.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 transition-colors hover:text-hamplard-primary"
            >
              <input
                type="checkbox"
                checked={selectedLevels.includes(level)}
                onChange={() => toggleLevel(level)}
                className="h-4 w-4 cursor-pointer rounded accent-hamplard-primary"
              />
              <span className="flex-1">{level}</span>
              <span className="text-xs text-ink-400">{countByLevel(level)}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="space-y-2">
          {PRICE_OPTIONS.map((option) => (
            <label
              key={option.label}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 transition-colors hover:text-hamplard-primary"
            >
              <input
                type="radio"
                name="price-range"
                checked={priceRangesEqual(priceRange, option.range)}
                onChange={() => setPriceRange(option.range)}
                className="h-4 w-4 cursor-pointer accent-hamplard-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="space-y-2">
          {RATING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 transition-colors hover:text-hamplard-primary"
            >
              <input
                type="radio"
                name="min-rating"
                checked={minRating === option.value}
                onChange={() => setMinRating(option.value)}
                className="h-4 w-4 cursor-pointer accent-hamplard-primary"
              />
              {option.value > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-saffron-400 text-saffron-400" />
                  {option.label}
                </span>
              ) : (
                <span>{option.label}</span>
              )}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Duration">
        <div className="space-y-2">
          {DURATION_BUCKETS.map((bucket) => (
            <label
              key={bucket.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 transition-colors hover:text-hamplard-primary"
            >
              <input
                type="checkbox"
                checked={selectedDurations.includes(bucket.value)}
                onChange={() => toggleDuration(bucket.value)}
                className="h-4 w-4 cursor-pointer rounded accent-hamplard-primary"
              />
              <span className="flex-1">{bucket.label}</span>
              <span className="text-xs text-ink-400">{countByDuration(bucket.value)}</span>
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

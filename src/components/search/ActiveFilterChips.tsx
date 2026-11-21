'use client';

import React from 'react';
import { X } from 'lucide-react';
import {
  useSearchStore,
  DURATION_BUCKETS,
  DEFAULT_PRICE_RANGE,
  type PriceRange,
} from '@/lib/hooks/use-search-store';

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

function priceLabel(range: PriceRange): string {
  if (range.min === 0 && range.max === 0) return 'Free';
  if (range.max === null) return `Over ₦${(range.min / 100).toFixed(0)}`;
  if (range.min === 0) return `Under ₦${(range.max / 100).toFixed(0)}`;
  return `₦${(range.min / 100).toFixed(0)} – ₦${(range.max / 100).toFixed(0)}`;
}

export function ActiveFilterChips() {
  const {
    query,
    setQuery,
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
    clearFilters,
  } = useSearchStore();

  const chips: Chip[] = [];

  if (query.trim()) {
    chips.push({ key: `q-${query}`, label: `“${query}”`, onRemove: () => setQuery('') });
  }

  selectedCategories.forEach((category) =>
    chips.push({
      key: `cat-${category}`,
      label: category,
      onRemove: () => toggleCategory(category),
    }),
  );

  selectedLevels.forEach((level) =>
    chips.push({ key: `lvl-${level}`, label: level, onRemove: () => toggleLevel(level) }),
  );

  const priceActive =
    priceRange.min !== DEFAULT_PRICE_RANGE.min || priceRange.max !== DEFAULT_PRICE_RANGE.max;
  if (priceActive) {
    chips.push({
      key: 'price',
      label: priceLabel(priceRange),
      onRemove: () => setPriceRange(DEFAULT_PRICE_RANGE),
    });
  }

  if (minRating > 0) {
    chips.push({
      key: 'rating',
      label: `${minRating.toFixed(1)}★ & up`,
      onRemove: () => setMinRating(0),
    });
  }

  selectedDurations.forEach((bucket) => {
    const label = DURATION_BUCKETS.find((b) => b.value === bucket)?.label ?? bucket;
    chips.push({
      key: `dur-${bucket}`,
      label,
      onRemove: () => toggleDuration(bucket),
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-ink-500">Active:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-pill bg-hamplard-lilac py-1 pl-3 pr-2 text-sm font-medium text-hamplard-deep transition-colors hover:bg-hamplard-primary hover:text-white"
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
          <span className="sr-only">Remove filter {chip.label}</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearFilters}
          className="ml-1 text-sm font-medium text-hamplard-mid underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

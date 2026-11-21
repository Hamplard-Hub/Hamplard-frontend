import React from 'react';
import { CourseCardSkeleton } from '@/components/skeletons/CourseCardSkeleton';

export function ResultsCountSkeleton() {
  return (
    <span
      data-testid="results-count-skeleton"
      className="inline-block h-5 w-24 rounded bg-hamplard-lilac animate-pulse"
    />
  );
}

export function FilterSidebarSkeleton() {
  return (
    <div data-testid="filter-sidebar-skeleton" className="space-y-6">
      <div className="flex items-center justify-between lg:hidden mb-4">
        <div className="h-6 w-24 rounded bg-hamplard-lilac animate-pulse" />
        <div className="h-6 w-6 rounded bg-hamplard-lilac animate-pulse" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-hamplard-lilac animate-pulse" />
        <div className="h-10 w-full rounded-lg border border-ink-100 bg-white animate-pulse" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-hamplard-lilac animate-pulse" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-hamplard-lilac animate-pulse" />
            <div className="h-4 flex-1 rounded bg-hamplard-lilac animate-pulse" />
            <div className="h-4 w-6 rounded bg-hamplard-lilac animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-11 w-full rounded-lg bg-hamplard-lilac animate-pulse" />
    </div>
  );
}

export function ResultsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
}

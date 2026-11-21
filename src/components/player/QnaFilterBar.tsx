'use client';

import { Search, Clock, ArrowBigUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QnaSortOption, QnaFilterOption } from '@/types';

interface QnaFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: QnaSortOption;
  onSortChange: (value: QnaSortOption) => void;
  filterBy: QnaFilterOption;
  onFilterChange: (value: QnaFilterOption) => void;
  resultCount: number;
  className?: string;
}

const SORT_OPTIONS: { value: QnaSortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'most_recent', label: 'Most Recent', icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" /> },
  { value: 'most_upvoted', label: 'Most Upvoted', icon: <ArrowBigUp className="w-3.5 h-3.5" aria-hidden="true" /> },
];

const FILTER_OPTIONS: { value: QnaFilterOption; label: string }[] = [
  { value: 'all', label: 'All Questions' },
  { value: 'mine', label: 'My Questions' },
  { value: 'unanswered', label: 'Unanswered' },
];

export function QnaFilterBar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  resultCount,
  className,
}: QnaFilterBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search Q&A"
          className="w-full rounded-xl border border-semantic-border pl-9 pr-9 py-2.5 text-sm text-hamplard-deep bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:border-hamplard-primary transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-pill bg-semantic-bg-surface border border-semantic-border"
          role="group"
          aria-label="Filter questions"
        >
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filterBy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange(opt.value)}
                aria-pressed={isActive}
                className={cn(
                  'px-3 py-1.5 rounded-pill text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-hamplard-primary text-white shadow-sm'
                    : 'text-hamplard-deep/70 hover:text-hamplard-deep hover:bg-white',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Sort toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-pill bg-semantic-bg-surface border border-semantic-border"
          role="group"
          aria-label="Sort questions"
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
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-semantic-text-muted">
        <span className="font-semibold text-hamplard-deep">{resultCount.toLocaleString()}</span>{' '}
        {resultCount === 1 ? 'question' : 'questions'}
      </p>
    </div>
  );
}
'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { DidYouMean } from './DidYouMean';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface EmptyResultsProps {
  query: string;
  /** Terms used for the "Did you mean…" spelling suggestion. */
  suggestionDictionary: string[];
  /** Categories offered as quick recovery links. */
  suggestedCategories: string[];
  hasActiveFilters: boolean;
  onSuggestionSelect: (term: string) => void;
  onClearFilters: () => void;
}

export function EmptyResults({
  query,
  suggestionDictionary,
  suggestedCategories,
  hasActiveFilters,
  onSuggestionSelect,
  onClearFilters,
}: EmptyResultsProps) {
  return (
    <EmptyState
      icon={<SearchX className="h-6 w-6" />}
      title="No courses found"
      description={
        query
          ? `We couldn't find anything matching “${query}”.`
          : 'No courses match your current filters.'
      }
      className="bg-white"
    >
      {query && (
        <div className="mb-6">
          <DidYouMean
            query={query}
            dictionary={suggestionDictionary}
            onSelect={onSuggestionSelect}
          />
        </div>
      )}

      {suggestedCategories.length > 0 && (
        <div className="mb-8 w-full max-w-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Popular categories
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedCategories.map((category) => (
              <Link
                key={category}
                href={`/search?category=${encodeURIComponent(category)}`}
                className="rounded-pill bg-hamplard-lilac px-3 py-1.5 text-sm font-medium text-hamplard-deep transition-colors hover:bg-hamplard-primary hover:text-white"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button variant="primary" size="md" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
    </EmptyState>
  );
}

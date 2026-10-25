'use client';

import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Sparkles, Filter } from 'lucide-react';
import type { GlossaryItem } from './GlossaryTerm';
import { cn } from '@/lib/utils';

export interface GlossaryPanelProps {
  glossary: GlossaryItem[];
  onSelectTerm?: (term: GlossaryItem) => void;
  className?: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function GlossaryPanel({ glossary, onSelectTerm, className }: GlossaryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Determine available starting letters
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const item of glossary) {
      if (item.term && item.term.length > 0) {
        letters.add(item.term[0].toUpperCase());
      }
    }
    return letters;
  }, [glossary]);

  // Filter and sort terms
  const filteredTerms = useMemo(() => {
    return glossary
      .filter((item) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesLetter =
          !selectedLetter ||
          item.term.toUpperCase().startsWith(selectedLetter);

        return matchesSearch && matchesLetter;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [glossary, searchQuery, selectedLetter]);

  // Group terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryItem[]> = {};
    for (const term of filteredTerms) {
      const letter = term.term[0]?.toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return groups;
  }, [filteredTerms]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header & Controls */}
      <div className="space-y-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-saffron-600" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-ink-900">
              Course Glossary
            </h2>
            <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-xs font-semibold text-saffron-800">
              {glossary.length} terms
            </span>
          </div>
          <p className="text-xs text-ink-500">
            A–Z dictionary of practical skill terms and definitions.
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search terms, definitions, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 text-sm"
            aria-label="Search glossary terms"
          />
        </div>

        {/* Alphabet quick-nav */}
        <div className="flex flex-wrap items-center gap-1 pt-1" role="group" aria-label="Filter terms by letter">
          <button
            type="button"
            onClick={() => setSelectedLetter(null)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              selectedLetter === null
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
            )}
          >
            All
          </button>
          {ALPHABET.map((letter) => {
            const hasTerms = availableLetters.has(letter);
            const isSelected = selectedLetter === letter;

            return (
              <button
                key={letter}
                type="button"
                disabled={!hasTerms}
                onClick={() => setSelectedLetter(isSelected ? null : letter)}
                className={cn(
                  'h-7 w-7 rounded-lg text-xs font-semibold transition-colors',
                  isSelected
                    ? 'bg-saffron-500 text-white shadow-sm'
                    : hasTerms
                      ? 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'
                      : 'cursor-not-allowed text-ink-300',
                )}
                aria-label={`Filter by letter ${letter}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Section */}
      {filteredTerms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-ink-300" aria-hidden="true" />
          <h3 className="mt-3 font-display text-base font-semibold text-ink-900">
            No terms found
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Try adjusting your search query or letter filter.
          </p>
          {(searchQuery || selectedLetter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedLetter(null);
              }}
              className="btn-secondary mt-4 px-4 py-2 text-xs"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTerms).map(([letter, terms]) => (
            <div key={letter} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-100 font-display text-sm font-bold text-saffron-900">
                  {letter}
                </span>
                <div className="h-px flex-1 bg-ink-100" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {terms.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectTerm?.(item)}
                    className={cn(
                      'card group relative flex flex-col justify-between overflow-hidden p-5 transition-all hover:border-saffron-300 hover:shadow-md',
                      onSelectTerm && 'cursor-pointer',
                    )}
                  >
                    <div>
                      {/* Top metadata */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display text-base font-bold text-ink-900 group-hover:text-saffron-700 transition-colors">
                          {item.term}
                        </h4>
                        {item.category && (
                          <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {item.phonetic && (
                        <p className="mt-0.5 text-[11px] font-mono text-ink-400">
                          /{item.phonetic}/
                        </p>
                      )}

                      {/* Optional Image */}
                      {item.imageUrl && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 aspect-video">
                          <img
                            src={item.imageUrl}
                            alt={item.term}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Definition */}
                      <p className="mt-3 text-xs leading-relaxed text-ink-600">
                        {item.definition}
                      </p>
                    </div>

                    {/* Related terms if available */}
                    {item.relatedTerms && item.relatedTerms.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-ink-100 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400">
                        <span>See also:</span>
                        {item.relatedTerms.map((rt) => (
                          <button
                            key={rt}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(rt);
                            }}
                            className="font-medium text-saffron-700 hover:underline"
                          >
                            {rt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

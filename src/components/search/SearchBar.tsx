'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, BookOpen, FolderOpen, User, TrendingUp } from 'lucide-react';
import { useSearchStore } from '@/lib/hooks/use-search-store';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

const SAMPLE_CATEGORIES = [
  'Tailoring',
  'Baking',
  'Photography',
  'Makeup Artistry',
  'Hairstyling',
  'Nail Technology',
];

// Shown in the dropdown's empty (unfocused-typing) state.
const TRENDING_CATEGORIES = ['Tailoring', 'Baking', 'Photography', 'Makeup Artistry'];

type SuggestionType = 'course' | 'category' | 'instructor';

interface Suggestion {
  type: SuggestionType;
  id: string;
  label: string;
  subtitle?: string;
  data: Course | string;
}

const TYPE_META: Record<SuggestionType, { icon: React.ReactNode; badge: string }> = {
  course: { icon: <BookOpen className="h-4 w-4 text-hamplard-primary" />, badge: 'Course' },
  category: { icon: <FolderOpen className="h-4 w-4 text-hamplard-primary" />, badge: 'Category' },
  instructor: { icon: <User className="h-4 w-4 text-hamplard-primary" />, badge: 'Instructor' },
};

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  courses?: Course[];
  isLoading?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search courses, instructors, categories...',
  showSuggestions = true,
  courses = [],
  isLoading = false,
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { query, setQuery } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!localQuery.trim() || !showSuggestions) return [];

    const queryLower = localQuery.toLowerCase();

    const categorySuggestions: Suggestion[] = SAMPLE_CATEGORIES.filter((cat) =>
      cat.toLowerCase().includes(queryLower),
    )
      .slice(0, 3)
      .map((cat) => ({ type: 'category', id: `cat-${cat}`, label: cat, data: cat }));

    const courseSuggestions: Suggestion[] = courses
      .filter(
        (course) =>
          course.title.toLowerCase().includes(queryLower) ||
          course.instructor?.name?.toLowerCase().includes(queryLower),
      )
      .slice(0, 5)
      .map((course) => ({
        type: 'course',
        id: `course-${course.id}`,
        label: course.title,
        subtitle: course.instructor?.name || 'Hamplard Instructor',
        data: course,
      }));

    // Unique instructors whose name matches.
    const seenInstructors = new Set<string>();
    const instructorSuggestions: Suggestion[] = [];
    for (const course of courses) {
      const name = course.instructor?.name;
      if (!name || seenInstructors.has(name)) continue;
      if (name.toLowerCase().includes(queryLower)) {
        seenInstructors.add(name);
        instructorSuggestions.push({
          type: 'instructor',
          id: `instructor-${name}`,
          label: name,
          subtitle: 'Instructor',
          data: name,
        });
      }
      if (instructorSuggestions.length >= 2) break;
    }

    return [...categorySuggestions, ...instructorSuggestions, ...courseSuggestions];
  }, [localQuery, showSuggestions, courses]);

  // Trending categories shown when the input is empty but focused.
  const showTrending = isOpen && !localQuery.trim() && showSuggestions;
  const hasQuery = Boolean(localQuery.trim());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onSearch?.(localQuery);
      router.push(`/search?q=${encodeURIComponent(localQuery)}`);
      setIsOpen(false);
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (suggestion.type === 'course') {
      router.push(`/dashboard/courses/${(suggestion.data as Course).id}`);
    } else if (suggestion.type === 'instructor') {
      setLocalQuery(suggestion.label);
      setQuery(suggestion.label);
      router.push(`/search?q=${encodeURIComponent(suggestion.label)}`);
    } else {
      setLocalQuery(suggestion.label);
      setQuery(suggestion.label);
      router.push(`/search?category=${encodeURIComponent(suggestion.label)}`);
    }
    setIsOpen(false);
  };

  const handleTrendingSelect = (category: string) => {
    setLocalQuery(category);
    setQuery(category);
    router.push(`/search?category=${encodeURIComponent(category)}`);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit(e as unknown as React.FormEvent);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSubmit(e as unknown as React.FormEvent);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showResultsDropdown = isOpen && hasQuery;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-5 w-5 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm transition-all',
              'text-ink-900 placeholder:text-ink-400',
              'border-ink-200 focus:border-hamplard-primary focus:outline-none focus:ring-2 focus:ring-hamplard-primary/20',
            )}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            role="combobox"
            aria-controls="search-suggestions"
          />

          {isLoading && (
            <Loader2 className="absolute right-3 h-5 w-5 animate-spin text-hamplard-primary" />
          )}

          {localQuery && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 rounded p-1 transition-colors hover:bg-ink-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-ink-400" />
            </button>
          )}
        </div>

        {/* Empty state — trending categories */}
        {showTrending && (
          <div
            id="search-suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-ink-200 bg-white shadow-lg"
          >
            <p className="flex items-center gap-2 px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <TrendingUp className="h-3.5 w-3.5" /> Trending
            </p>
            <ul className="pb-2">
              {TRENDING_CATEGORIES.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => handleTrendingSelect(category)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                  >
                    <FolderOpen className="h-4 w-4 text-hamplard-primary" />
                    <span>{category}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Results dropdown — loading, results, or no-results */}
        {showResultsDropdown && (
          <div
            id="search-suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg"
          >
            {isLoading ? (
              <ul className="py-2" aria-label="Loading suggestions">
                {Array.from({ length: 4 }).map((_, index) => (
                  <li key={index} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="h-4 w-4 animate-pulse rounded bg-hamplard-lilac" />
                    <span className="h-4 flex-1 animate-pulse rounded bg-hamplard-lilac" />
                  </li>
                ))}
              </ul>
            ) : suggestions.length > 0 ? (
              <>
                <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={suggestion.id} role="option" aria-selected={index === selectedIndex}>
                      <button
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                          index === selectedIndex
                            ? 'bg-hamplard-lilac text-hamplard-deep'
                            : 'text-ink-700 hover:bg-ink-50',
                        )}
                      >
                        {TYPE_META[suggestion.type].icon}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{suggestion.label}</p>
                          {suggestion.subtitle && (
                            <p className="truncate text-xs text-ink-400">{suggestion.subtitle}</p>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-xs text-ink-400">
                          {TYPE_META[suggestion.type].badge}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Keyboard navigation hints */}
                <div className="flex items-center gap-3 border-t border-ink-100 bg-ink-50 px-4 py-2 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-ink-200 bg-white px-1 font-sans">↑</kbd>
                    <kbd className="rounded border border-ink-200 bg-white px-1 font-sans">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-ink-200 bg-white px-1 font-sans">↵</kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-ink-200 bg-white px-1 font-sans">esc</kbd>
                    dismiss
                  </span>
                </div>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-ink-500">No courses or categories found</p>
                <p className="mt-1 text-xs text-ink-400">Try searching for a different term</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

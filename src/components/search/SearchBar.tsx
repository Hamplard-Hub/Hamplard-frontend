'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { query, setQuery } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);

  const suggestions = useMemo(() => {
    if (!localQuery.trim() || !showSuggestions) return [];

    const queryLower = localQuery.toLowerCase();

    // Filter courses by title or instructor
    const courseSuggestions = courses
      .filter(
        (course) =>
          course.title.toLowerCase().includes(queryLower) ||
          course.instructor?.name?.toLowerCase().includes(queryLower),
      )
      .slice(0, 5)
      .map((course) => ({
        type: 'course' as const,
        id: course.id,
        label: course.title,
        subtitle: course.instructor?.name || 'Hamplard Instructor',
        icon: '📚',
        data: course,
      }));

    // Filter categories
    const categorySuggestions = SAMPLE_CATEGORIES.filter((cat) =>
      cat.toLowerCase().includes(queryLower),
    )
      .slice(0, 3)
      .map((cat) => ({
        type: 'category' as const,
        id: cat,
        label: cat,
        subtitle: undefined,
        icon: '📂',
        data: cat,
      }));

    return [...categorySuggestions, ...courseSuggestions];
  }, [localQuery, showSuggestions, courses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setQuery(value);
    setIsOpen(value.length > 0);
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

  const handleSuggestionSelect = (suggestion: (typeof suggestions)[0]) => {
    if (suggestion.type === 'course') {
      router.push(`/dashboard/courses/${suggestion.id}`);
    } else {
      setLocalQuery(suggestion.label);
      setQuery(suggestion.label);
      router.push(`/search?category=${encodeURIComponent(suggestion.label)}`);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit(e as any);
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
          handleSubmit(e as any);
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
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-ink-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => localQuery.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-lg transition-all',
              'placeholder:text-ink-400 text-ink-900',
              'border-ink-200 focus:border-hamplard-primary focus:outline-none focus:ring-2 focus:ring-hamplard-primary/20',
              isLoading && 'pr-12',
            )}
            aria-autocomplete="list"
            aria-expanded={isOpen && suggestions.length > 0}
            role="combobox"
          />

          {isLoading && (
            <Loader2 className="absolute right-3 w-5 h-5 text-hamplard-primary animate-spin" />
          )}

          {localQuery && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 hover:bg-ink-100 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-ink-400" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ink-200 rounded-lg shadow-lg z-50">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors',
                      index === selectedIndex
                        ? 'bg-hamplard-lilac text-hamplard-deep'
                        : 'text-ink-700 hover:bg-ink-50',
                    )}
                  >
                    <span className="text-base">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{suggestion.label}</p>
                      {suggestion.subtitle && (
                        <p className="text-xs text-ink-400 truncate">{suggestion.subtitle}</p>
                      )}
                    </div>
                    {suggestion.type === 'course' && (
                      <span className="text-xs text-ink-400 whitespace-nowrap">Course</span>
                    )}
                    {suggestion.type === 'category' && (
                      <span className="text-xs text-ink-400 whitespace-nowrap">Category</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Results Message */}
        {isOpen && localQuery && suggestions.length === 0 && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ink-200 rounded-lg shadow-lg z-50 p-4 text-center">
            <p className="text-sm text-ink-500">No courses or categories found</p>
            <p className="text-xs text-ink-400 mt-1">Try searching for a different term</p>
          </div>
        )}
      </form>
    </div>
  );
}

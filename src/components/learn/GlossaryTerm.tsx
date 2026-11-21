'use client';

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { BookOpen, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlossaryItem {
  id: string;
  term: string;
  definition: string;
  category?: string;
  imageUrl?: string | null;
  phonetic?: string;
  relatedTerms?: string[];
}

export interface GlossaryTermProps {
  /** The glossary entry item */
  item?: GlossaryItem;
  /** Or pass term and definition directly */
  term?: string;
  definition?: string;
  imageUrl?: string | null;
  category?: string;
  children?: ReactNode;
  className?: string;
  onSelect?: (item: GlossaryItem) => void;
}

/**
 * An inline skill term with a keyboard-accessible hover/tap tooltip definition.
 */
export function GlossaryTerm({
  item,
  term: propTerm,
  definition: propDefinition,
  imageUrl: propImageUrl,
  category: propCategory,
  children,
  className,
  onSelect,
}: GlossaryTermProps) {
  const termName = item?.term ?? propTerm ?? '';
  const definition = item?.definition ?? propDefinition ?? '';
  const imageUrl = item?.imageUrl ?? propImageUrl ?? null;
  const category = item?.category ?? propCategory;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      containerRef.current?.focus();
    }
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
    if (item && onSelect) {
      onSelect(item);
    }
  };

  const tooltipId = `glossary-tooltip-${termName.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'cursor-help rounded-sm font-medium text-ink-900 underline decoration-saffron-500 decoration-dotted underline-offset-4 transition-colors',
          'hover:text-saffron-700 hover:decoration-solid focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:ring-offset-1',
          isOpen && 'text-saffron-800 decoration-solid bg-saffron-50',
          className,
        )}
      >
        {children || termName}
      </span>

      {/* Tooltip Popover */}
      {isOpen && (
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="dialog"
          aria-label={`Definition of ${termName}`}
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 transform rounded-2xl border border-ink-100 bg-white p-4 shadow-xl',
            'animate-in fade-in zoom-in-95 duration-150',
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-ink-100 pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-saffron-600" aria-hidden="true" />
                <span className="font-display font-semibold text-ink-900">{termName}</span>
              </div>
              {category && (
                <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-wider text-saffron-700">
                  {category}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
              aria-label="Close definition"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Optional Image */}
          {imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 aspect-video">
              <img
                src={imageUrl}
                alt={termName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Definition */}
          <p className="mt-2 text-xs leading-relaxed text-ink-600">{definition}</p>

          {/* Bottom pointer arrow */}
          <div
            className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-ink-100 bg-white"
            aria-hidden="true"
          />
        </div>
      )}
    </span>
  );
}

/**
 * Automatically underlines glossary terms found in a plain text string
 * and wraps them in accessible GlossaryTerm tooltips.
 */
export function highlightGlossaryTerms(
  text: string,
  glossary: GlossaryItem[],
): ReactNode[] {
  if (!text || glossary.length === 0) return [text];

  // Map term names to items (case-insensitive)
  const termMap = new Map<string, GlossaryItem>();
  for (const item of glossary) {
    termMap.set(item.term.toLowerCase(), item);
  }

  // Sort terms by length descending to match multi-word phrases first
  const sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);

  // Build regex with word boundaries
  const escapedTerms = sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedWord = match[0];
    const item = termMap.get(matchedWord.toLowerCase());

    if (item) {
      parts.push(
        <GlossaryTerm key={`term-${match.index}`} item={item}>
          {matchedWord}
        </GlossaryTerm>,
      );
    } else {
      parts.push(matchedWord);
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

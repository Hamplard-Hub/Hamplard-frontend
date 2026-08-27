'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { Button } from '@/components/ui/Button';
import { useSearchStore } from '@/lib/hooks/use-search-store';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  /** Number of results the current filters resolve to, shown on the apply button. */
  resultCount: number;
}

export function FilterDrawer({ open, onClose, courses, resultCount }: FilterDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const clearFilters = useSearchStore((s) => s.clearFilters);

  // Escape-to-close, focus trap entry, and body-scroll lock while open.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-ink-900/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter courses"
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-lg outline-none transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4">
          <h2 className="text-lg font-semibold text-ink-900">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <FilterPanel courses={courses} />
        </div>

        <div className="flex items-center gap-3 border-t border-ink-100 px-4 py-4">
          <Button variant="tertiary" size="md" onClick={clearFilters} className="flex-1">
            Clear all
          </Button>
          <Button variant="primary" size="md" onClick={onClose} className="flex-1">
            Show {resultCount} result{resultCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}

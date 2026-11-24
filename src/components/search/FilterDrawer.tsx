'use client';

import React from 'react';
import { FilterPanel } from './FilterPanel';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useSearchStore } from '@/lib/hooks/use-search-store';
import type { Course } from '@/types';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  /** Number of results the current filters resolve to, shown on the apply button. */
  resultCount: number;
}

export function FilterDrawer({ open, onClose, courses, resultCount }: FilterDrawerProps) {
  const clearFilters = useSearchStore((s) => s.clearFilters);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      title="Filters"
      closeLabel="Close filters"
      className="lg:hidden"
    >
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
    </Drawer>
  );
}

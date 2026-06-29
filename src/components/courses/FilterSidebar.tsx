'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

const LEVELS  = ['Beginner', 'Intermediate', 'Advanced'];
const PRICES  = [
  { label: 'Free',        value: 'free'   },
  { label: 'Under $20',   value: 'under20' },
  { label: '$20 – $50',   value: '20to50'  },
  { label: 'Over $50',    value: 'over50'  },
];

interface Props {
  open:          boolean;
  onClose:       () => void;
  categories:    Category[];
  activeCategory:string;
  activeLevel:   string;
  activePrice:   string;
  onCategory:    (v: string) => void;
  onLevel:       (v: string) => void;
  onPrice:       (v: string) => void;
  onClearAll:    () => void;
}

export function FilterSidebar({
  open, onClose, categories,
  activeCategory, activeLevel, activePrice,
  onCategory, onLevel, onPrice, onClearAll,
}: Props) {
  const hasFilters = !!(activeCategory || activeLevel || activePrice);

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-ink-900">Filters</p>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="text-xs text-saffron-600 font-medium hover:underline"
            >
              Clear all
            </button>
          )}
          {/* Close only on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-ink-50 text-ink-400"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
          Category
        </p>
        <div className="space-y-1">
          <button
            onClick={() => onCategory('')}
            className={cn(
              'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
              !activeCategory
                ? 'bg-saffron-50 text-saffron-700 font-medium'
                : 'text-ink-600 hover:bg-ink-50',
            )}
          >
            All categories
          </button>
          {categories.map(c => (
            <button
              key={c.name}
              onClick={() => onCategory(c.name)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between',
                activeCategory === c.name
                  ? 'bg-saffron-50 text-saffron-700 font-medium'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              <span>{c.name}</span>
              <span className="text-xs text-ink-400">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
          Level
        </p>
        <div className="space-y-1">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => onLevel(activeLevel === l ? '' : l)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                activeLevel === l
                  ? 'bg-saffron-50 text-saffron-700 font-medium'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
          Price
        </p>
        <div className="space-y-1">
          {PRICES.map(p => (
            <button
              key={p.value}
              onClick={() => onPrice(activePrice === p.value ? '' : p.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                activePrice === p.value
                  ? 'bg-saffron-50 text-saffron-700 font-medium'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <div className="card p-4 sticky top-6">
          {content}
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative w-72 bg-white h-full shadow-xl overflow-y-auto p-5 animate-slide-up">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
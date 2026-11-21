'use client';

import { useState } from 'react';
import { CheckCheck, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BulkActionType = 'publish' | 'unpublish' | 'delete' | 'category';

interface BulkActionBarProps {
  selectedCount: number;
  categories: string[];
  isBusy?: boolean;
  onApply: (action: BulkActionType, category?: string) => void;
}

export function BulkActionBar({
  selectedCount,
  categories,
  isBusy = false,
  onApply,
}: BulkActionBarProps) {
  const [action, setAction] = useState<BulkActionType>('publish');
  const [category, setCategory] = useState<string>('');

  if (selectedCount === 0) return null;

  const handleApply = () => {
    if (action === 'category' && !category) return;
    onApply(action, action === 'category' ? category : undefined);
  };

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#D5D2F6] bg-[#F7F5FF] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-[#26215C] px-2.5 py-1 text-xs font-semibold text-white">
          {selectedCount} selected
        </span>
        <span className="text-sm text-[#4A467A]">Bulk actions</span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative">
          <select
            aria-label="Select a bulk action"
            value={action}
            onChange={(event) => setAction(event.target.value as BulkActionType)}
            className="h-10 appearance-none rounded-xl border border-[#D3D0F2] bg-white px-3 pr-8 text-sm font-medium text-[#26215C] outline-none"
          >
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish</option>
            <option value="delete">Delete</option>
            <option value="category">Change category</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A467A]" aria-hidden="true" />
        </div>

        {action === 'category' ? (
          <div className="relative">
            <select
              aria-label="Choose a new course category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 appearance-none rounded-xl border border-[#D3D0F2] bg-white px-3 pr-8 text-sm text-[#26215C] outline-none"
            >
              <option value="">Choose category</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A467A]" aria-hidden="true" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleApply}
          disabled={isBusy || (action === 'category' && !category)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
            action === 'delete'
              ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
              : 'bg-[#4A42B8] text-white hover:bg-[#3C3489] disabled:bg-[#A5A0E0]',
          )}
        >
          {action === 'delete' ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
          {isBusy ? 'Updating...' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

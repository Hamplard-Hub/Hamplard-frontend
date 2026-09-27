'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export type RevenuePreset = '3m' | '6m' | '12m' | 'custom';

export interface RevenueDateRange {
  preset: RevenuePreset;
  /** Inclusive start, yyyy-MM-dd */
  from: string;
  /** Inclusive end, yyyy-MM-dd */
  to: string;
}

const PRESETS: { value: Exclude<RevenuePreset, 'custom'>; label: string; months: number }[] = [
  { value: '3m', label: 'Last 3M', months: 3 },
  { value: '6m', label: 'Last 6M', months: 6 },
  { value: '12m', label: 'Last 12M', months: 12 },
];

const ISO_DAY = 'yyyy-MM-dd';

/** Build the range for a preset: the start of the month N-1 months ago through today. */
export const rangeForPreset = (preset: Exclude<RevenuePreset, 'custom'>): RevenueDateRange => {
  const months = PRESETS.find((p) => p.value === preset)?.months ?? 12;
  const today = new Date();
  return {
    preset,
    from: format(startOfMonth(subMonths(today, months - 1)), ISO_DAY),
    to: format(today, ISO_DAY),
  };
};

export const formatRangeLabel = (range: RevenueDateRange) =>
  `${format(parseISO(range.from), 'MMM d, yyyy')} – ${format(parseISO(range.to), 'MMM d, yyyy')}`;

interface RevenueDateRangePickerProps {
  value: RevenueDateRange;
  onChange: (range: RevenueDateRange) => void;
}

export function RevenueDateRangePicker({ value, onChange }: RevenueDateRangePickerProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = format(new Date(), ISO_DAY);
  const draftInvalid = !draftFrom || !draftTo || draftFrom > draftTo || draftTo > today;

  // Reset the draft to the current range whenever the popover opens
  useEffect(() => {
    if (customOpen) {
      setDraftFrom(value.from);
      setDraftTo(value.to);
    }
  }, [customOpen, value.from, value.to]);

  useEffect(() => {
    if (!customOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setCustomOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCustomOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [customOpen]);

  const applyCustom = () => {
    if (draftInvalid) return;
    onChange({ preset: 'custom', from: draftFrom, to: draftTo });
    setCustomOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(rangeForPreset(preset.value))}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            value.preset === preset.value
              ? 'bg-hamplard-primary text-white'
              : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
          )}
        >
          {preset.label}
        </button>
      ))}

      <div ref={popoverRef} className="relative">
        <button
          onClick={() => setCustomOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={customOpen}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            value.preset === 'custom'
              ? 'bg-hamplard-primary text-white'
              : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          {value.preset === 'custom' ? formatRangeLabel(value) : 'Custom'}
          <ChevronDown className="w-3 h-3" />
        </button>

        {customOpen && (
          <div
            role="dialog"
            aria-label="Select custom date range"
            className="absolute right-0 mt-2 z-20 w-72 bg-white border border-ink-100 rounded-xl shadow-lg p-4 space-y-3"
          >
            <label className="block">
              <span className="block text-xs font-medium text-ink-600 mb-1">From</span>
              <input
                type="date"
                value={draftFrom}
                max={draftTo || today}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-ink-600 mb-1">To</span>
              <input
                type="date"
                value={draftTo}
                min={draftFrom}
                max={today}
                onChange={(e) => setDraftTo(e.target.value)}
                className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
              />
            </label>
            {draftFrom && draftTo && draftFrom > draftTo && (
              <p className="text-xs text-red-500">Start date must be before end date.</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setCustomOpen(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-ink-600 hover:bg-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={applyCustom}
                disabled={draftInvalid}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-hamplard-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  /** Current value as YYYY-MM-DD or empty string */
  value?: string;
  /** Called with YYYY-MM-DD or empty string */
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Minimum selectable date as YYYY-MM-DD */
  min?: string;
  /** Maximum selectable date as YYYY-MM-DD */
  max?: string;
  className?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-describedby'?: string;
  /** Accessible label for the calendar button when no visible label is associated */
  calendarLabel?: string;
}

const ISO_FMT = 'yyyy-MM-dd';
const DISPLAY_FMT = 'MMM d, yyyy';

function parseISODate(value?: string): Date | null {
  if (!value) return null;
  const d = parse(value, ISO_FMT, new Date());
  return isValid(d) ? d : null;
}

function toISODate(date: Date): string {
  return format(date, ISO_FMT);
}

function isDateDisabled(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
  if (minDate && isBefore(date, minDate) && !isSameDay(date, minDate)) return true;
  if (maxDate && isAfter(date, maxDate) && !isSameDay(date, maxDate)) return true;
  return false;
}

function clampToBounds(date: Date, minDate: Date | null, maxDate: Date | null): Date {
  let d = date;
  if (minDate && isBefore(d, minDate)) d = minDate;
  if (maxDate && isAfter(d, maxDate)) d = maxDate;
  return d;
}

function getInitialFocusDate(value: Date | null, minDate: Date | null, maxDate: Date | null): Date {
  const base = value ?? new Date();
  return clampToBounds(base, minDate, maxDate);
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value = '',
    onChange,
    onBlur,
    name,
    id,
    placeholder = 'YYYY-MM-DD',
    disabled = false,
    min,
    max,
    className,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    calendarLabel = 'Choose date',
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const dialogId = `${inputId}-dialog`;
  const gridId = `${inputId}-grid`;
  const labelId = `${inputId}-month-label`;

  const minDate = useMemo(() => parseISODate(min), [min]);
  const maxDate = useMemo(() => parseISODate(max), [max]);
  const selectedDate = useMemo(() => parseISODate(value), [value]);

  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(value);
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(getInitialFocusDate(selectedDate, minDate, maxDate)),
  );
  const [focusedDate, setFocusedDate] = useState<Date>(() =>
    getInitialFocusDate(selectedDate, minDate, maxDate),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  // Merge forwarded ref
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref],
  );

  // Sync input text when external value changes
  useEffect(() => {
    setInputText(value);
  }, [value]);

  // When opening, sync view/focus to selected or today
  useEffect(() => {
    if (open) {
      const focus = getInitialFocusDate(selectedDate, minDate, maxDate);
      setFocusedDate(focus);
      setViewMonth(startOfMonth(focus));
      // Focus the active cell after render
      requestAnimationFrame(() => {
        const active = gridRef.current?.querySelector<HTMLButtonElement>(
          '[data-focused="true"]',
        );
        active?.focus();
      });
    }
  }, [open, selectedDate, minDate, maxDate]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const commitValue = useCallback(
    (next: string) => {
      onChange?.(next);
    },
    [onChange],
  );

  const selectDate = useCallback(
    (date: Date) => {
      if (isDateDisabled(date, minDate, maxDate)) return;
      const iso = toISODate(date);
      setInputText(iso);
      commitValue(iso);
      setOpen(false);
      inputRef.current?.focus();
    },
    [commitValue, minDate, maxDate],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    // Accept YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = parseISODate(raw);
      if (parsed && !isDateDisabled(parsed, minDate, maxDate)) {
        commitValue(raw);
        setFocusedDate(parsed);
        setViewMonth(startOfMonth(parsed));
        return;
      }
    }
    if (raw === '') {
      commitValue('');
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't blur-commit if focus moved inside the picker
    const next = e.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) return;

    // On blur, normalize: if valid date, format as ISO; if invalid non-empty, revert to last valid value
    if (inputText === '') {
      commitValue('');
      onBlur?.();
      return;
    }
    const parsed = parseISODate(inputText);
    if (parsed && !isDateDisabled(parsed, minDate, maxDate)) {
      const iso = toISODate(parsed);
      setInputText(iso);
      commitValue(iso);
    } else {
      // Revert to current value
      setInputText(value);
    }
    onBlur?.();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !open)) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const moveFocus = useCallback(
    (next: Date) => {
      const clamped = clampToBounds(next, minDate, maxDate);
      setFocusedDate(clamped);
      setViewMonth(startOfMonth(clamped));
      requestAnimationFrame(() => {
        gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
      });
    },
    [minDate, maxDate],
  );

  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case 'ArrowRight':
        next = addDays(focusedDate, 1);
        break;
      case 'ArrowLeft':
        next = addDays(focusedDate, -1);
        break;
      case 'ArrowDown':
        next = addDays(focusedDate, 7);
        break;
      case 'ArrowUp':
        next = addDays(focusedDate, -7);
        break;
      case 'PageDown':
        next = addMonths(focusedDate, e.shiftKey ? 12 : 1);
        break;
      case 'PageUp':
        next = addMonths(focusedDate, e.shiftKey ? -12 : -1);
        break;
      case 'Home':
        next = startOfWeek(focusedDate);
        break;
      case 'End':
        next = endOfWeek(focusedDate);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectDate(focusedDate);
        return;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        inputRef.current?.focus();
        return;
      case 'Tab':
        // Allow tab to move through dialog controls naturally; close on tab out handled by focus management
        setOpen(false);
        return;
      default:
        return;
    }
    if (next) {
      e.preventDefault();
      moveFocus(next);
    }
  };

  // Build calendar grid
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    const days: Date[] = [];
    let cur = gridStart;
    while (cur <= gridEnd) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [viewMonth]);

  const monthLabel = format(viewMonth, 'MMMM yyyy');

  const prevMonthDisabled = minDate
    ? isBefore(endOfMonth(addMonths(viewMonth, -1)), startOfMonth(minDate))
    : false;
  const nextMonthDisabled = maxDate
    ? isAfter(startOfMonth(addMonths(viewMonth, 1)), endOfMonth(maxDate))
    : false;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={setInputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          className={cn('input pr-10', className)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-hamplard-primary disabled:opacity-50 disabled:pointer-events-none"
          aria-label={calendarLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          tabIndex={-1}
        >
          <CalendarIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {open && !disabled && (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-label="Choose date"
          className="absolute z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-ink-200 bg-white p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              disabled={prevMonthDisabled}
              className="rounded-md p-1.5 text-ink-600 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-hamplard-primary disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div id={labelId} className="text-sm font-semibold text-ink-900" aria-live="polite">
              {monthLabel}
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              disabled={nextMonthDisabled}
              className="rounded-md p-1.5 text-ink-600 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-hamplard-primary disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <table
            ref={gridRef}
            id={gridId}
            role="grid"
            aria-labelledby={labelId}
            className="w-full border-collapse"
            onKeyDown={handleGridKeyDown}
          >
            <thead>
              <tr>
                {WEEK_DAYS.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    abbr={day}
                    className="h-8 w-8 text-center text-xs font-medium text-ink-500"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day) => {
                    const outside = !isSameMonth(day, viewMonth);
                    const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const focused = isSameDay(day, focusedDate);
                    const isDisabled = isDateDisabled(day, minDate, maxDate);
                    const today = isSameDay(day, new Date());
                    return (
                      <td key={day.toISOString()} role="presentation" className="p-0.5">
                        <button
                          type="button"
                          role="gridcell"
                          aria-selected={selected}
                          aria-disabled={isDisabled || undefined}
                          aria-current={today ? 'date' : undefined}
                          tabIndex={focused ? 0 : -1}
                          data-focused={focused ? 'true' : undefined}
                          disabled={isDisabled}
                          onClick={() => selectDate(day)}
                          className={cn(
                            'flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-hamplard-primary',
                            outside && 'text-ink-300',
                            !outside && !selected && !isDisabled && 'text-ink-900 hover:bg-ink-100',
                            selected && 'bg-hamplard-primary text-white hover:bg-hamplard-mid',
                            today && !selected && 'ring-1 ring-hamplard-primary',
                            isDisabled && 'cursor-not-allowed text-ink-300 opacity-50',
                          )}
                        >
                          <span aria-hidden="true">{format(day, 'd')}</span>
                          <span className="sr-only">{format(day, DISPLAY_FMT)}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2">
            <button
              type="button"
              onClick={() => {
                const today = clampToBounds(new Date(), minDate, maxDate);
                setFocusedDate(today);
                setViewMonth(startOfMonth(today));
                if (!isDateDisabled(today, minDate, maxDate)) {
                  selectDate(today);
                }
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-hamplard-primary hover:bg-hamplard-lilac focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText('');
                commitValue('');
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DatePicker;

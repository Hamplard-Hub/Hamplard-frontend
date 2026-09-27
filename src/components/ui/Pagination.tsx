'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  /** Current page number (1-based). If omitted, synced with URL parameter. */
  currentPage?: number;
  /** Total number of pages. Takes precedence over totalItems. */
  totalPages?: number;
  /** Total count of items across all pages. Used to calculate totalPages if not directly provided. */
  totalItems?: number;
  /** Number of items per page. Defaults to 10 when calculating totalPages from totalItems. */
  itemsPerPage?: number;
  /** Optional callback fired when the page changes. */
  onPageChange?: (page: number) => void;
  /** Search parameter key used for URL synchronization. Defaults to 'page'. */
  paramName?: string;
  /** Whether to automatically sync page changes with the URL search params. Defaults to true. */
  updateUrl?: boolean;
  /** Optional additional class names for the root container. */
  className?: string;
}

/**
 * Builds array of page items to render in pagination bar.
 * Returns page numbers and 'ellipsis' string placeholders.
 */
function buildPageItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  paramName = 'page',
  updateUrl = true,
  className,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine effective active page from prop or URL
  const urlParamValue = searchParams?.get(paramName);
  const parsedUrlPage = urlParamValue ? parseInt(urlParamValue, 10) : 1;
  const activePage = currentPage ?? (isNaN(parsedUrlPage) || parsedUrlPage < 1 ? 1 : parsedUrlPage);

  // Determine effective total pages
  const finalTotalPages =
    totalPages ?? (totalItems !== undefined && itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 0);

  const pageButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const hasMounted = useRef(false);
  const [jumpValue, setJumpValue] = useState('');

  // Focus management for keyboard accessibility on page change
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    pageButtonRefs.current.get(activePage)?.focus();
  }, [activePage]);

  if (finalTotalPages <= 1) return null;

  const items = buildPageItems(activePage, finalTotalPages);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > finalTotalPages || newPage === activePage) return;

    if (onPageChange) {
      onPageChange(newPage);
    }

    if (updateUrl && router && pathname) {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      params.set(paramName, String(newPage));
      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(targetUrl, { scroll: false });
    }
  };

  function handleJump() {
    const parsed = parseInt(jumpValue, 10);
    setJumpValue('');
    if (isNaN(parsed)) return;
    // Clamp out-of-range values to the nearest valid page
    handlePageChange(Math.min(Math.max(parsed, 1), finalTotalPages));
  }

  function handleJumpKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Keep arrow keys inside the input from triggering the nav's prev/next shortcut
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleJump();
    }
  }

  function handleArrowKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft' && activePage > 1) {
      e.preventDefault();
      handlePageChange(activePage - 1);
    } else if (e.key === 'ArrowRight' && activePage < finalTotalPages) {
      e.preventDefault();
      handlePageChange(activePage + 1);
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
      onKeyDown={handleArrowKey}
    >
      {/* ── Previous ── */}
      <button
        type="button"
        onClick={() => handlePageChange(activePage - 1)}
        disabled={activePage <= 1}
        aria-label="Go to previous page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* ── Mobile label ── */}
      <span className="sm:hidden px-3 py-1.5 text-sm text-ink-600">
        Page {activePage} of {finalTotalPages}
      </span>

      {/* ── Page buttons (hidden on mobile) ── */}
      <div className="hidden sm:contents" role="group" aria-label="Page numbers">
        {items.map((item, idx) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-9 w-9 items-center justify-center text-sm text-ink-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              ref={(el) => {
                if (el) pageButtonRefs.current.set(item, el);
                else pageButtonRefs.current.delete(item);
              }}
              type="button"
              onClick={() => handlePageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === activePage ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all',
                item === activePage
                  ? 'bg-[#7F77DD] text-white shadow-sm font-semibold'
                  : 'border border-ink-200 text-ink-600 hover:bg-ink-50',
              )}
            >
              {item}
            </button>
          ),
        )}
      </div>

      {/* ── Next ── */}
      <button
        type="button"
        onClick={() => handlePageChange(activePage + 1)}
        disabled={activePage >= finalTotalPages}
        aria-label="Go to next page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* ── Jump to page ── */}
      <div className="ml-2 flex items-center gap-1">
        <label htmlFor={`${paramName}-jump`} className="sr-only">
          Jump to page
        </label>
        <input
          id={`${paramName}-jump`}
          type="number"
          inputMode="numeric"
          min={1}
          max={finalTotalPages}
          placeholder="Page"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={handleJumpKeyDown}
          className="h-9 w-16 rounded-xl border border-ink-200 px-2 text-center text-sm text-ink-700 focus:border-[#7F77DD] focus:outline-none focus:ring-1 focus:ring-[#7F77DD] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={handleJump}
          disabled={jumpValue.trim() === ''}
          aria-label="Go to entered page"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-ink-200 px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Go
        </button>
      </div>
    </nav>
  );
}

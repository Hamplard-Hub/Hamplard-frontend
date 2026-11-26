'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

export type DrawerSide = 'left' | 'right' | 'bottom';

export interface DrawerProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Called when the drawer requests to close (Esc, overlay click, swipe, close button). */
  onClose: () => void;
  /** Edge the drawer slides in from. */
  side?: DrawerSide;
  /** Optional heading. When set, a header with a close button is rendered. */
  title?: React.ReactNode;
  /** Accessible label, used when no visible `title` is rendered. */
  ariaLabel?: string;
  /** Id of an element inside `children` that labels the drawer. */
  ariaLabelledBy?: string;
  /** Accessible label for the built-in close button. */
  closeLabel?: string;
  /** Disable closing with the Escape key. */
  disableEscape?: boolean;
  /** Disable closing when the overlay is clicked. */
  disableOverlayClick?: boolean;
  /** Disable swipe-to-close on touch devices. */
  disableSwipe?: boolean;
  /** Extra classes for the outer fixed container (e.g. `lg:hidden`). */
  className?: string;
  /** Extra classes for the sliding panel (e.g. width overrides). */
  panelClassName?: string;
  /** Optional id for the panel element. */
  id?: string;
  children: React.ReactNode;
}

// ── Constants ──────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Distance (px) a swipe must travel toward the closing edge to dismiss. */
const SWIPE_CLOSE_THRESHOLD = 80;

const sideClasses: Record<DrawerSide, { panel: string; open: string; closed: string }> = {
  left: {
    panel: 'inset-y-0 left-0 h-full w-[85%] max-w-sm',
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
  right: {
    panel: 'inset-y-0 right-0 h-full w-[85%] max-w-sm',
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
  bottom: {
    panel: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl',
    open: 'translate-y-0',
    closed: 'translate-y-full',
  },
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Accessible slide-in drawer / sheet.
 *
 * - Slides in from the left, right or bottom edge
 * - Traps focus while open and restores it to the opener on close
 * - Closes on Escape, overlay click and swipe toward its edge on touch devices
 * - Locks body scroll while open
 */
export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  ariaLabel,
  ariaLabelledBy,
  closeLabel = 'Close',
  disableEscape = false,
  disableOverlayClick = false,
  disableSwipe = false,
  className,
  panelClassName,
  id,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`drawer-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeAxisLocked = useRef<'swipe' | 'scroll' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Keep the latest onClose without retriggering the focus effect each render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus trap, Escape-to-close, scroll lock and focus restoration.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const opener = document.activeElement;

    const getFocusable = (): HTMLElement[] =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    const focusTimer = window.setTimeout(() => {
      const [first] = getFocusable();
      (first ?? panel).focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscape) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active && !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener !== document.body && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open, disableEscape]);

  // Reset any in-progress drag when the drawer closes.
  useEffect(() => {
    if (!open) setDragOffset(0);
  }, [open]);

  // ── Swipe to close ───────────────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disableSwipe || e.touches.length !== 1) return;
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      swipeAxisLocked.current = null;
    },
    [disableSwipe],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      if (!start) return;

      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;

      // Decide once per gesture whether this is a swipe or a content scroll.
      if (swipeAxisLocked.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        const horizontal = Math.abs(dx) > Math.abs(dy);
        const isSwipe = side === 'bottom' ? !horizontal : horizontal;
        // For a bottom sheet, only treat a downward drag as a swipe when the
        // touched content is scrolled to the top, so inner scrolling still works.
        let scrolledContent = false;
        if (side === 'bottom') {
          let node = e.target as HTMLElement | null;
          while (node && node !== panelRef.current) {
            if (node.scrollTop > 0) {
              scrolledContent = true;
              break;
            }
            node = node.parentElement;
          }
        }
        swipeAxisLocked.current = isSwipe && !scrolledContent ? 'swipe' : 'scroll';
      }

      if (swipeAxisLocked.current !== 'swipe') return;

      const offset = side === 'left' ? Math.min(0, dx) : side === 'right' ? Math.max(0, dx) : Math.max(0, dy);
      setDragOffset(offset);
    },
    [side],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchStart.current && Math.abs(dragOffset) > SWIPE_CLOSE_THRESHOLD) {
      onCloseRef.current();
    }
    touchStart.current = null;
    swipeAxisLocked.current = null;
    setDragOffset(0);
  }, [dragOffset]);

  const isDragging = dragOffset !== 0;
  const dragStyle: React.CSSProperties | undefined = isDragging
    ? {
        transform: side === 'bottom' ? `translateY(${dragOffset}px)` : `translateX(${dragOffset}px)`,
        transition: 'none',
      }
    : undefined;

  const classes = sideClasses[side];
  const labelledBy = title ? titleId : ariaLabelledBy;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        open
          ? 'visible pointer-events-auto'
          : 'invisible pointer-events-none transition-[visibility] delay-300',
        className,
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-ink-900/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={disableOverlayClick ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={dragStyle}
        className={cn(
          'absolute flex flex-col bg-white shadow-lg outline-none transition-transform duration-300 ease-out motion-reduce:transition-none',
          classes.panel,
          open ? classes.open : classes.closed,
          panelClassName,
        )}
      >
        {side === 'bottom' && (
          <div className="flex justify-center pt-3" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-ink-200" />
          </div>
        )}

        {title && (
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4">
            <h2 id={titleId} className="text-lg font-semibold text-ink-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default Drawer;

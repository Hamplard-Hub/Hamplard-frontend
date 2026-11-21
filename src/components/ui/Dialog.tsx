"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ===========================================================================
   Types
   =========================================================================== */

interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog content */
  children: React.ReactNode;
  /** Initial focus element selector */
  initialFocus?: string;
  /** Disable close on escape */
  disableEscape?: boolean;
  /** Disable close on backdrop click */
  disableBackdropClick?: boolean;
  /** Disable scroll lock on body */
  disableScrollLock?: boolean;
  /** Additional className */
  className?: string;
}

interface DialogContentProps {
  /** Dialog content */
  children: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional className */
  className?: string;
  /** Hide close button */
  hideCloseButton?: boolean;
}

interface DialogHeaderProps {
  /** Header content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface DialogTitleProps {
  /** Title content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Override ID */
  id?: string;
}

interface DialogDescriptionProps {
  /** Description content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Override ID */
  id?: string;
}

interface DialogBodyProps {
  /** Body content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface DialogFooterProps {
  /** Footer content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Layout variant */
  layout?: "start" | "center" | "end" | "spread";
}

/* ===========================================================================
   Context
   =========================================================================== */

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
  titleId: string;
  descriptionId: string;
  initialFocusRef: React.RefObject<HTMLElement | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
}

/* ===========================================================================
   Utility Functions
   =========================================================================== */

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/* ===========================================================================
   Main Dialog Component
   =========================================================================== */

export function Dialog({
  open,
  onClose,
  children,
  initialFocus,
  disableEscape = false,
  disableBackdropClick = false,
  disableScrollLock = false,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const initialFocusRef = useRef<HTMLElement | null>(null);

  const titleId = generateId("dialog-title");
  const descriptionId = generateId("dialog-description");

  // Store previous active element to restore focus
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Focus trap and escape handling
  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus first focusable element
    const focusInitial = () => {
      if (initialFocus) {
        const el = dialog.querySelector(initialFocus) as HTMLElement;
        if (el) {
          el.focus();
          initialFocusRef.current = el;
          return;
        }
      }
      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
        initialFocusRef.current = focusable[0];
      }
    };

    // Delay focus to ensure dialog is rendered
    const timeoutId = setTimeout(focusInitial, 0);

    // Handle keydown for focus trap and escape
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape" && !disableEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab") {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, disableEscape, initialFocus]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (!disableBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [disableBackdropClick, onClose]
  );

  // Scroll lock
  useEffect(() => {
    if (!open || disableScrollLock) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPadding = window.getComputedStyle(document.body).paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPadding;
    };
  }, [open, disableScrollLock]);

  // Restore focus on close
  useEffect(() => {
    if (!open && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const contextValue: DialogContextValue = {
    open,
    onClose,
    titleId,
    descriptionId,
    initialFocusRef,
  };

  return (
    <DialogContext.Provider value={contextValue}>
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-black/50 p-4 backdrop-blur-sm",
          "animate-in fade-in duration-200",
          className
        )}
        role="presentation"
        onClick={handleBackdropClick}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "relative w-full rounded-xl bg-white shadow-2xl",
            "animate-in zoom-in-95 fade-in duration-200",
            "max-h-[90vh] overflow-hidden flex flex-col"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

/* ===========================================================================
   Sub-components
   =========================================================================== */

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function DialogContent({
  children,
  size = "md",
  className,
  hideCloseButton = false,
}: DialogContentProps) {
  const { onClose, titleId, descriptionId } = useDialogContext();

  return (
    <div className={cn(sizeClasses[size], "flex flex-col", className)}>
      {!hideCloseButton && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <div id={`${titleId}-content`}>{children}</div>
    </div>
  );
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn("px-6 pt-6 pb-2", className)}>{children}</div>
  );
}

export function DialogTitle({
  children,
  className,
  id,
}: DialogTitleProps) {
  const { titleId } = useDialogContext();

  return (
    <h2
      id={id || titleId}
      className={cn("text-xl font-semibold text-ink-900", className)}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className,
  id,
}: DialogDescriptionProps) {
  const { descriptionId } = useDialogContext();

  return (
    <p
      id={id || descriptionId}
      className={cn("mt-2 text-sm text-ink-600", className)}
    >
      {children}
    </p>
  );
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function DialogFooter({
  children,
  className,
  layout = "end",
}: DialogFooterProps) {
  const layoutClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    spread: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 pb-6 pt-2",
        layoutClasses[layout],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ===========================================================================
   Export
   =========================================================================== */

export default Dialog;
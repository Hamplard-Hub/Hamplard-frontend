import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldErrorProps {
  id?: string;
  /** Error message. Nothing is shown when empty. */
  children?: React.ReactNode;
  /** Show a leading alert icon. */
  showIcon?: boolean;
  className?: string;
}

/**
 * Field-level error message. The element stays mounted as a polite live
 * region so screen readers announce the message as soon as it appears, and
 * the control references it through `aria-describedby` so it is re-read on
 * focus.
 */
export function FieldError({ id, children, showIcon = false, className }: FieldErrorProps) {
  const hasError = children !== undefined && children !== null && children !== false && children !== '';

  return (
    <p
      id={id}
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        hasError ? 'mt-1 flex items-center gap-1 text-xs text-red-600' : 'sr-only',
        className,
      )}
    >
      {hasError && showIcon && <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {hasError ? children : null}
    </p>
  );
}

export default FieldError;

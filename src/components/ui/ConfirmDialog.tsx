'use client';

import { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Label shown on the confirm button while `isLoading` is true. */
  loadingText?: string;
  /** Red confirm button for destructive actions. */
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Small modal for "are you sure?" moments. Focus starts on Cancel so a stray
 * Enter never triggers the destructive action, and Escape / the backdrop close
 * it unless the action is already running.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingText,
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Move focus in on open and hand it back to the trigger on close.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-4 py-6">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={isLoading ? undefined : onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="mt-0.5 rounded-full bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold text-ink-900">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm leading-6 text-ink-600">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelRef} variant="tertiary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText={loadingText}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastRole = 'status' | 'alert';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  role: ToastRole;
  duration: number;
};

type ToastOptions = {
  title: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  push: (toast: ToastOptions & { variant?: ToastVariant; role?: ToastRole }) => void;
  dismiss: (id: string) => void;
  success: (toast: ToastOptions) => void;
  error: (toast: ToastOptions) => void;
  warning: (toast: ToastOptions) => void;
  info: (toast: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLeaving(true);
      window.setTimeout(() => onDismiss(toast.id), 220);
    }, toast.duration);

    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.duration, toast.id]);

  const accent = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    error: 'border-rose-300 bg-rose-50 text-rose-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    info: 'border-[#D5D2F6] bg-[#F4F2FF] text-[#26215C]',
  }[toast.variant];

  return (
    <div
      role={toast.role}
      className={cn(
        'pointer-events-auto w-[min(22rem,calc(100vw-2rem))] rounded-2xl border p-4 shadow-lg backdrop-blur transition-all duration-300',
        accent,
        isLeaving ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-sm leading-6 opacity-90">{toast.description}</p> : null}
        </div>
        <button
          type="button"
          className="rounded-full p-1 transition hover:bg-black/5"
          aria-label="Dismiss notification"
          onClick={() => {
            setIsLeaving(true);
            window.setTimeout(() => onDismiss(toast.id), 180);
          }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ title, description, duration = 4000, variant = 'info', role }: ToastOptions & { variant?: ToastVariant; role?: ToastRole }) => {
      const id = createToastId();
      const toast: ToastItem = { id, title, description, variant, role: role ?? (variant === 'error' ? 'alert' : 'status'), duration };
      setToasts((current) => [...current, toast].slice(-4));
    },
    [],
  );

  const success = useCallback((toast: ToastOptions) => push({ ...toast, variant: 'success' }), [push]);
  const error = useCallback((toast: ToastOptions) => push({ ...toast, variant: 'error' }), [push]);
  const warning = useCallback((toast: ToastOptions) => push({ ...toast, variant: 'warning' }), [push]);
  const info = useCallback((toast: ToastOptions) => push({ ...toast, variant: 'info' }), [push]);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, success, error, warning, info }),
    [dismiss, error, info, push, success, toasts, warning],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex flex-col gap-3" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used inside ToastProvider');
  }
  return context;
}

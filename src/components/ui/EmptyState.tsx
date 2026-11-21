'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  const action = actionLabel ? (
    actionHref ? (
      <Link href={actionHref} className="btn-primary mt-4 inline-flex">
        {actionLabel}
      </Link>
    ) : (
      <button type="button" onClick={onAction} className="btn-primary mt-4 inline-flex">
        {actionLabel}
      </button>
    )
  ) : null;

  return (
    <div
      className={cn(
        'card flex flex-col items-center justify-center p-12 text-center',
        className,
      )}
    >
      {icon ? <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-saffron-700">{icon}</div> : null}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-ink-400">{description}</p> : null}
      {children}
      {action}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { useProfileCompletion } from '@/lib/hooks/use-profile-completion';
import { cn } from '@/lib/utils';

interface ProfileCompletionProps {
  className?: string;
  variant?: 'sidebar' | 'card';
}

/**
 * Profile Completion Progress Indicator
 *
 * Shows users their profile completion percentage and a checklist of items
 * they need to complete. Displays differently based on role (student vs instructor).
 *
 * Variants:
 * - 'sidebar': Compact version for sidebar (shows progress bar + percentage)
 * - 'card': Full card with checklist items
 */
export function ProfileCompletion({ className, variant = 'card' }: ProfileCompletionProps) {
  const { user } = useAuthStore();
  const { percentage, items, isComplete, completedCount, totalCount } =
    useProfileCompletion(user, user?.role);

  if (!user) {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <SidebarVariant
        percentage={percentage}
        isComplete={isComplete}
        completedCount={completedCount}
        totalCount={totalCount}
        className={className}
      />
    );
  }

  return (
    <CardVariant
      percentage={percentage}
      items={items}
      isComplete={isComplete}
      completedCount={completedCount}
      totalCount={totalCount}
      className={className}
    />
  );
}

interface SidebarVariantProps {
  percentage: number;
  isComplete: boolean;
  completedCount: number;
  totalCount: number;
  className?: string;
}

function SidebarVariant({
  percentage,
  isComplete,
  completedCount,
  totalCount,
  className,
}: SidebarVariantProps) {
  return (
    <div className={cn('px-3 py-4 border-t border-ink-100', className)}>
      {isComplete ? (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-leaf-50 border border-leaf-200">
          <CheckCircle2 className="w-5 h-5 text-leaf-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-leaf-700">Profile complete!</p>
            <p className="text-[10px] text-leaf-600">All set for success</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-ink-600">Profile {percentage}% complete</p>
            <p className="text-[10px] text-ink-400">
              {completedCount}/{totalCount}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-saffron-500 to-hamplard-primary rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <Link
            href="/dashboard/profile"
            className="text-[10px] font-medium text-hamplard-primary hover:underline mt-2 inline-block"
          >
            Complete profile →
          </Link>
        </div>
      )}
    </div>
  );
}

interface CardVariantProps {
  percentage: number;
  items: Array<{
    key: string;
    label: string;
    href: string;
    completed: boolean;
  }>;
  isComplete: boolean;
  completedCount: number;
  totalCount: number;
  className?: string;
}

function CardVariant({
  percentage,
  items,
  isComplete,
  completedCount,
  totalCount,
  className,
}: CardVariantProps) {
  return (
    <div className={cn('card p-6', className)}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-ink-900">Profile Completion</h3>
          <span className="text-sm font-bold text-hamplard-primary">{percentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-saffron-500 to-hamplard-primary rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label={`Profile ${percentage}% complete`}
          />
        </div>

        {/* Progress text */}
        <p className="text-xs text-ink-500 mt-2">
          {completedCount} of {totalCount} items completed
        </p>
      </div>

      {/* Completion badge (shows at 100%) */}
      {isComplete && (
        <div className="mb-5 p-3 rounded-lg bg-leaf-50 border border-leaf-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-leaf-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-leaf-700">Profile complete!</p>
            <p className="text-xs text-leaf-600">Your profile looks great.</p>
          </div>
        </div>
      )}

      {/* Items checklist */}
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-all',
              item.completed
                ? 'bg-leaf-50 hover:bg-leaf-100'
                : 'bg-ink-50 hover:bg-ink-100',
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-leaf-600 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-ink-300 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  item.completed ? 'text-leaf-700 line-through' : 'text-ink-700',
                )}
              >
                {item.label}
              </p>
            </div>
            {!item.completed && (
              <span className="text-xs text-ink-400 font-medium flex-shrink-0">→</span>
            )}
          </Link>
        ))}
      </div>

      {/* Help text */}
      {!isComplete && (
        <p className="text-xs text-ink-500 mt-4">
          Complete your profile to improve your course and certificate trust with students.
        </p>
      )}
    </div>
  );
}

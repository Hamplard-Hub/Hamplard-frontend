'use client';

import { Clock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface QuizTimerProps {
  /** Seconds remaining on the assessment clock. */
  secondsLeft: number;
  /** Text used for the accessible label. */
  label?: string;
  /** Renders the warning styling (used when under 30 seconds remain). */
  isWarning?: boolean;
  className?: string;
}

/**
 * Compact countdown display for timed quizzes.
 *
 * The warning state is also exposed as `data-warning` so styling and tests can
 * key off it without relying on class names.
 */
export function QuizTimer({
  secondsLeft,
  label = 'Time remaining',
  isWarning = false,
  className,
}: QuizTimerProps) {
  const time = formatDuration(Math.max(0, Math.floor(secondsLeft)));

  return (
    <div
      role="timer"
      aria-live="off"
      data-warning={isWarning ? 'true' : 'false'}
      aria-label={`${label}: ${time}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold tabular-nums transition-colors',
        isWarning
          ? 'border-rose-300 bg-rose-50 text-rose-700'
          : 'border-ink-200 bg-ink-50 text-ink-700',
        className,
      )}
    >
      <Clock
        className={cn('h-4 w-4', isWarning && 'animate-pulse')}
        aria-hidden="true"
      />
      <span>{time}</span>
    </div>
  );
}

export default QuizTimer;

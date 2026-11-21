'use client';

import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  min?: number;
  max?: number;
  className?: string;
  trackColor?: string;
  progressColor?: string;
  label?: string;
  showValue?: boolean;
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  min = 0,
  max = 100,
  className,
  trackColor = 'stroke-ink-100',
  progressColor = 'stroke-saffron-500',
  label,
  showValue = true,
}: ProgressRingProps) {
  const safeValue = Math.min(Math.max(value, min), max);
  const boundedMax = max - min || 1;
  const radius = Math.max((size - stroke) / 2, 0);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((safeValue - min) / boundedMax) * circumference;
  const percent = Math.round(((safeValue - min) / boundedMax) * 100);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible -rotate-90"
        role="progressbar"
        aria-label={label ?? `Progress ${percent}%`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${percent}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={progressColor}
        />
      </svg>

      {showValue ? (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ink-800">
          {percent}%
        </span>
      ) : null}
    </div>
  );
}

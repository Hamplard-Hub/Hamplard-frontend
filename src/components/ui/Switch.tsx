'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'aria-checked'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md';
}

const trackSizes = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const thumbSizes = {
  sm: { base: 'h-4 w-4', on: 'translate-x-4' },
  md: { base: 'h-5 w-5', on: 'translate-x-5' },
};

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      description,
      size = 'md',
      disabled,
      id,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const switchId = id ?? `switch-${generatedId}`;
    const labelId = label ? `${switchId}-label` : undefined;
    const descriptionId = description ? `${switchId}-description` : undefined;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) return;
      onCheckedChange(!checked);
    };

    const control = (
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={props['aria-label'] ? undefined : labelId}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-saffron-500' : 'bg-ink-200',
          trackSizes[size],
          !label && !description && className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-white shadow transition-transform duration-200',
            thumbSizes[size].base,
            checked ? thumbSizes[size].on : 'translate-x-0'
          )}
        />
      </button>
    );

    if (!label && !description) return control;

    return (
      <div className={cn('flex items-start justify-between gap-4', className)}>
        <div className="min-w-0">
          {label && (
            <label
              id={labelId}
              htmlFor={switchId}
              className={cn(
                'block text-sm font-medium text-ink-900',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-xs text-ink-500">
              {description}
            </p>
          )}
        </div>
        <div className="mt-0.5">{control}</div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };

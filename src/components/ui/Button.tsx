'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-hamplard-primary text-white hover:bg-hamplard-mid active:bg-hamplard-deep disabled:bg-ink-100 disabled:text-ink-400',
  secondary: 'bg-hamplard-lilac text-hamplard-deep hover:bg-saffron-100 active:bg-saffron-200 disabled:bg-ink-100 disabled:text-ink-400',
  tertiary: 'border border-ink-200 text-ink-900 hover:bg-ink-50 active:bg-ink-100 disabled:border-ink-100 disabled:text-ink-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-ink-100 disabled:text-ink-400',
  ghost: 'text-hamplard-primary hover:bg-hamplard-lilac active:bg-saffron-100 disabled:text-ink-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-md',
  md: 'px-4 py-2 text-sm font-medium rounded-lg',
  lg: 'px-6 py-3 text-base font-semibold rounded-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Loading...',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hamplard-primary disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isLoading && 'opacity-90',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex items-center">{icon}</span>}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <span className="flex items-center">{icon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonVariant, ButtonSize, ButtonProps };

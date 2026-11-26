'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useFieldControlProps } from './FormField';

/** Shared control styling, also used by `Textarea` and `Select`. */
export const controlBaseClasses =
  'w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition focus-visible:ring-2 focus-visible:ring-[#7F77DD]/40 disabled:cursor-not-allowed disabled:opacity-60';

export const controlStateClasses = (invalid: boolean) =>
  invalid ? 'border-red-400 bg-red-50/40 focus:border-red-500' : 'border-[#D3D0F2] focus:border-[#7F77DD]';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input that picks up `id`, `aria-invalid` and `aria-describedby` from
 * the surrounding `FormField`. Forwards its ref, so react-hook-form's
 * `register()` works as-is.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props },
  ref,
) {
  const { invalid, ...a11y } = useFieldControlProps({
    id,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
  });

  return (
    <input
      ref={ref}
      {...a11y}
      className={cn(controlBaseClasses, controlStateClasses(invalid), className)}
      {...props}
    />
  );
});

export default Input;

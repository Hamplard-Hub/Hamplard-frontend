'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useFieldControlProps } from './FormField';
import { controlBaseClasses, controlStateClasses } from './Input';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Native select wired to the surrounding `FormField`. Forwards its ref for react-hook-form. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, id, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props },
  ref,
) {
  const { invalid, ...a11y } = useFieldControlProps({
    id,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
  });

  return (
    <select
      ref={ref}
      {...a11y}
      className={cn(controlBaseClasses, controlStateClasses(invalid), className)}
      {...props}
    />
  );
});

export default Select;

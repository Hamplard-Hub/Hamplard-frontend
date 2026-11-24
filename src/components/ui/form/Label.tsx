import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Show a required marker after the label text. */
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, children, required, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('mb-1.5 block text-sm font-medium text-[#26215C]', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-red-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
});

export default Label;

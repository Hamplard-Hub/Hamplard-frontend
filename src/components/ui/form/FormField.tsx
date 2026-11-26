'use client';

import React, { createContext, useContext, useId } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { FieldError } from './FieldError';

// ── Context ────────────────────────────────────────────────────────────────

export interface FormFieldContextValue {
  /** Id applied to the control and referenced by the label's `htmlFor`. */
  id: string;
  /** Id of the error message element. */
  errorId: string;
  /** Id of the hint element, when a hint is rendered. */
  hintId?: string;
  /** Whether the field currently has an error. */
  invalid: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** Read the surrounding `FormField` wiring. Returns `null` outside a field. */
export function useFormField() {
  return useContext(FormFieldContext);
}

/**
 * Build the accessibility props a control needs from the surrounding field,
 * merging any caller-supplied `id` / `aria-*` values.
 */
export function useFieldControlProps(props: {
  id?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
}) {
  const field = useFormField();
  const describedBy = [
    props['aria-describedby'],
    field?.hintId,
    field?.invalid ? field.errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: props.id ?? field?.id,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid ? true : undefined),
    'aria-describedby': describedBy || undefined,
    invalid: Boolean(props['aria-invalid'] ?? field?.invalid),
  };
}

// ── FormField ──────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Visible label text. */
  label?: React.ReactNode;
  /** Error message. When set, the control is marked `aria-invalid` and described by it. */
  error?: React.ReactNode;
  /** Optional helper text, linked via `aria-describedby`. */
  hint?: React.ReactNode;
  /** Control id. Generated automatically when omitted. */
  id?: string;
  /** Show a required marker next to the label. */
  required?: boolean;
  /** Show the error icon before the message. */
  showErrorIcon?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}

/**
 * Wraps a label, a control and its error message, wiring `id`, `htmlFor`,
 * `aria-invalid` and `aria-describedby` automatically. Use with the
 * `Input`, `Textarea` and `Select` primitives (which forward refs, so
 * react-hook-form's `register()` can be spread onto them directly).
 *
 * @example
 * <FormField label="Email" error={errors.email?.message}>
 *   <Input type="email" {...register('email')} />
 * </FormField>
 */
export function FormField({
  label,
  error,
  hint,
  id,
  required,
  showErrorIcon,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId.replace(/:/g, '')}`;
  const errorId = `${controlId}-error`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const invalid = Boolean(error);

  return (
    <FormFieldContext.Provider value={{ id: controlId, errorId, hintId, invalid }}>
      <div className={cn(className)}>
        {label && (
          <Label htmlFor={controlId} required={required} className={labelClassName}>
            {label}
          </Label>
        )}
        {children}
        {hint && (
          <p id={hintId} className="mt-1 text-xs text-[#6B66A6]">
            {hint}
          </p>
        )}
        <FieldError id={errorId} showIcon={showErrorIcon}>
          {error}
        </FieldError>
      </div>
    </FormFieldContext.Provider>
  );
}

export default FormField;

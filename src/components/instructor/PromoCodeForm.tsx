'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { promoCodeSchema, type PromoCodeFormValues } from '@/lib/validations/promo-code';
import { promoCodesApi } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/** A promo code as returned by `promoCodesApi.getMy`. */
export interface PromoCode {
  id: string;
  code: string;
  discountType: PromoCodeFormValues['discountType'];
  discountValue: number;
  expiryDate: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
}

/** "20%" for percentage codes, "$5" for fixed-amount codes. */
export const formatPromoDiscount = ({
  discountType,
  discountValue,
}: Pick<PromoCode, 'discountType' | 'discountValue'>): string =>
  discountType === 'PERCENTAGE' ? `${discountValue}%` : `$${discountValue}`;

interface PromoCodeFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PromoCodeForm({ onSuccess, onError }: PromoCodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: 100,
    },
  });

  const onSubmit = async (values: PromoCodeFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await promoCodesApi.create({
        code: values.code.toUpperCase(),
        discountType: values.discountType,
        discountValue: values.discountValue,
        expiryDate: values.expiryDate,
        maxUses: values.maxUses,
      });

      reset();
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create promo code.';
      setSubmitError(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {submitError && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800">{submitError}</p>
        </div>
      )}

      {/* Code */}
      <div>
        <label htmlFor="code" className="label">
          Promo Code
        </label>
        <input
          id="code"
          type="text"
          placeholder="e.g., SUMMER20"
          className={cn(
            'input w-full',
            errors.code && 'border-rose-500 focus:ring-rose-500',
          )}
          {...register('code')}
          aria-invalid={errors.code ? 'true' : 'false'}
          aria-describedby={errors.code ? 'code-error' : undefined}
        />
        {errors.code && (
          <p id="code-error" className="mt-1 text-xs text-rose-600">
            {errors.code.message}
          </p>
        )}
      </div>

      {/* Discount Type & Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="discountType" className="label">
            Discount Type
          </label>
          <select
            id="discountType"
            className={cn(
              'input w-full',
              errors.discountType && 'border-rose-500 focus:ring-rose-500',
            )}
            {...register('discountType')}
            aria-invalid={errors.discountType ? 'true' : 'false'}
            aria-describedby={errors.discountType ? 'discountType-error' : undefined}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
          {errors.discountType && (
            <p id="discountType-error" className="mt-1 text-xs text-rose-600">
              {errors.discountType.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="discountValue" className="label">
            Discount Value {/* @ts-ignore */}
            {register('discountType').value === 'PERCENTAGE' ? '(%)' : '($)'}
          </label>
          <input
            id="discountValue"
            type="number"
            step={/* @ts-ignore */ register('discountType').value === 'PERCENTAGE' ? '1' : '0.01'}
            min="0"
            placeholder="Enter value"
            className={cn(
              'input w-full',
              errors.discountValue && 'border-rose-500 focus:ring-rose-500',
            )}
            {...register('discountValue', { valueAsNumber: true })}
            aria-invalid={errors.discountValue ? 'true' : 'false'}
            aria-describedby={errors.discountValue ? 'discountValue-error' : undefined}
          />
          {errors.discountValue && (
            <p id="discountValue-error" className="mt-1 text-xs text-rose-600">
              {errors.discountValue.message}
            </p>
          )}
        </div>
      </div>

      {/* Expiry Date & Max Uses */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="label">
            Expiry Date
          </label>
          <input
            id="expiryDate"
            type="date"
            className={cn(
              'input w-full',
              errors.expiryDate && 'border-rose-500 focus:ring-rose-500',
            )}
            {...register('expiryDate')}
            aria-invalid={errors.expiryDate ? 'true' : 'false'}
            aria-describedby={errors.expiryDate ? 'expiryDate-error' : undefined}
          />
          {errors.expiryDate && (
            <p id="expiryDate-error" className="mt-1 text-xs text-rose-600">
              {errors.expiryDate.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="maxUses" className="label">
            Max Uses
          </label>
          <input
            id="maxUses"
            type="number"
            min="1"
            placeholder="e.g., 100"
            className={cn(
              'input w-full',
              errors.maxUses && 'border-rose-500 focus:ring-rose-500',
            )}
            {...register('maxUses', { valueAsNumber: true })}
            aria-invalid={errors.maxUses ? 'true' : 'false'}
            aria-describedby={errors.maxUses ? 'maxUses-error' : undefined}
          />
          {errors.maxUses && (
            <p id="maxUses-error" className="mt-1 text-xs text-rose-600">
              {errors.maxUses.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        loadingText="Creating..."
        fullWidth
      >
        Create Promo Code
      </Button>
    </form>
  );
}

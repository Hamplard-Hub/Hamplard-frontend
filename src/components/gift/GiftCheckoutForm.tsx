'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, MessageSquare, Calendar, Gift } from 'lucide-react';
import { giftSchema, type GiftFormValues } from '@/lib/validations/gift';
import { cn } from '@/lib/utils';

interface GiftCheckoutFormProps {
  courseTitle: string;
  coursePrice: number;
  onSubmit: (values: GiftFormValues) => Promise<void>;
}

export function GiftCheckoutForm({
  courseTitle,
  coursePrice,
  onSubmit,
}: GiftCheckoutFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GiftFormValues>({
    resolver: zodResolver(giftSchema),
    defaultValues: {
      recipientEmail: '',
      message: '',
      deliveryDate: todayStr,
    },
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Course summary banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-saffron-100 bg-saffron-50 px-4 py-3">
        <Gift className="h-5 w-5 shrink-0 text-saffron-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{courseTitle}</p>
          <p className="text-xs text-ink-500">
            You're gifting this course · ${parseFloat(String(coursePrice)).toFixed(2)} USDC
          </p>
        </div>
      </div>

      {/* Recipient email */}
      <div>
        <label htmlFor="recipientEmail" className="label">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
            Recipient email <span className="text-red-500">*</span>
          </span>
        </label>
        <input
          id="recipientEmail"
          type="email"
          autoComplete="off"
          placeholder="friend@example.com"
          aria-invalid={!!errors.recipientEmail}
          aria-describedby={errors.recipientEmail ? 'recipientEmail-error' : undefined}
          className={cn(
            'input',
            errors.recipientEmail && 'border-red-400 bg-red-50/40 focus:border-red-400',
          )}
          {...register('recipientEmail')}
        />
        {errors.recipientEmail && (
          <p id="recipientEmail-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.recipientEmail.message}
          </p>
        )}
      </div>

      {/* Delivery date */}
      <div>
        <label htmlFor="deliveryDate" className="label">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
            Delivery date <span className="text-red-500">*</span>
          </span>
        </label>
        <input
          id="deliveryDate"
          type="date"
          min={todayStr}
          aria-invalid={!!errors.deliveryDate}
          aria-describedby={errors.deliveryDate ? 'deliveryDate-error' : undefined}
          className={cn(
            'input',
            errors.deliveryDate && 'border-red-400 bg-red-50/40 focus:border-red-400',
          )}
          {...register('deliveryDate')}
        />
        {errors.deliveryDate && (
          <p id="deliveryDate-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.deliveryDate.message}
          </p>
        )}
        <p className="mt-1 text-xs text-ink-400">
          The recipient will receive their gift link on this date.
        </p>
      </div>

      {/* Personal message */}
      <div>
        <label htmlFor="message" className="label">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
            Personal message{' '}
            <span className="font-normal text-ink-400">(optional)</span>
          </span>
        </label>
        <textarea
          id="message"
          rows={4}
          placeholder="Write a short note to your recipient…"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={cn(
            'textarea',
            errors.message && 'border-red-400 bg-red-50/40 focus:border-red-400',
          )}
          {...register('message')}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Processing gift…
          </>
        ) : (
          <>
            <Gift className="h-4 w-4" aria-hidden="true" />
            Send this gift
          </>
        )}
      </button>
    </form>
  );
}

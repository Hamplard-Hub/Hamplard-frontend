'use client';

import React, { useEffect, useId, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { PaymentMethod, StripeCardElementChangeEvent } from '@stripe/stripe-js';
import { AlertCircle, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StripeProvider } from '@/components/checkout/StripeProvider';
import { friendlyStripeError } from '@/lib/stripe/errors';
import { isStripeConfigured } from '@/lib/stripe/client';
import { cn } from '@/lib/utils';

export interface AddPaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Persist the card Stripe just tokenised. Throw to keep the modal open and
   * show the error inside it.
   */
  onAdd: (paymentMethod: PaymentMethod) => Promise<void>;
}

const FIELD_CLASS =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-hamplard-primary focus:outline-none focus:ring-2 focus:ring-hamplard-primary/30 disabled:bg-ink-50';

/** Modal wrapper — mounts Stripe Elements only while it is open. */
export function AddPaymentMethodModal({ open, onClose, onAdd }: AddPaymentMethodModalProps) {
  const titleId = useId();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-4 py-6">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={submitting ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id={titleId} className="pr-8 font-display text-lg font-semibold text-ink-900">
          Add payment method
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Save a card for faster checkout. You can remove it at any time.
        </p>

        <StripeProvider>
          <AddCardForm onAdd={onAdd} onCancel={onClose} onSubmittingChange={setSubmitting} />
        </StripeProvider>
      </div>
    </div>
  );
}

interface AddCardFormProps {
  onAdd: (paymentMethod: PaymentMethod) => Promise<void>;
  onCancel: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}

function AddCardForm({ onAdd, onCancel, onSubmittingChange }: AddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const fieldId = useId();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const stripeUnavailable = !isStripeConfigured();

  const setBusy = (busy: boolean) => {
    setSubmitting(busy);
    onSubmittingChange(busy);
  };

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    setNameError(trimmedName ? null : 'Enter the name printed on your card.');
    if (!cardComplete) setCardError((prev) => prev ?? 'Enter your full card details.');
    if (!trimmedName || !cardComplete) return;

    const card = elements?.getElement(CardElement);
    if (!stripe || !card) {
      setFormError('Card payments are still loading. Give it a second and try again.');
      return;
    }

    setBusy(true);
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: { name: trimmedName },
      });
      if (error || !paymentMethod) {
        setFormError(friendlyStripeError(error));
        return;
      }
      await onAdd(paymentMethod);
    } catch (addError) {
      setFormError(
        addError instanceof Error && addError.message
          ? addError.message
          : friendlyStripeError(addError),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="mt-5 space-y-4">
      {stripeUnavailable && (
        <p className="flex items-start gap-2 rounded-lg border border-saffron-200 bg-saffron-50 p-3 text-sm text-saffron-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Card payments are not configured in this environment, so cards cannot be saved yet.
        </p>
      )}

      <fieldset className="space-y-4" disabled={submitting || stripeUnavailable}>
        <div>
          <label htmlFor={`${fieldId}-name`} className="mb-1.5 block text-sm text-ink-700">
            Cardholder name
          </label>
          <input
            id={`${fieldId}-name`}
            type="text"
            autoComplete="cc-name"
            placeholder="Name as printed on the card"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(null);
            }}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? `${fieldId}-name-error` : undefined}
            className={cn(FIELD_CLASS, nameError && 'border-rose-500')}
          />
          {nameError && (
            <p id={`${fieldId}-name-error`} role="alert" className="mt-1.5 text-sm text-rose-700">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm text-ink-700">Card details</span>
          <div
            className={cn(
              'rounded-lg border border-ink-200 bg-white px-3 py-3 focus-within:border-hamplard-primary focus-within:ring-2 focus-within:ring-hamplard-primary/30',
              cardError && 'border-rose-500',
            )}
          >
            <CardElement
              options={{ hidePostalCode: false, disabled: submitting }}
              onChange={handleCardChange}
            />
          </div>
          {cardError && (
            <p role="alert" className="mt-1.5 text-sm text-rose-700">
              {cardError}
            </p>
          )}
        </div>
      </fieldset>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          {formError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="tertiary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={submitting}
          loadingText="Saving card…"
          disabled={!stripe || stripeUnavailable}
          icon={<Lock className="h-4 w-4" aria-hidden="true" />}
        >
          Save card
        </Button>
      </div>
    </form>
  );
}

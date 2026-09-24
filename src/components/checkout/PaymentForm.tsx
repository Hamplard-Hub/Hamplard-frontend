'use client';

import React, { useId, useRef, useState } from 'react';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  PaymentMethod,
  StripeCardNumberElementChangeEvent,
  StripeElementChangeEvent,
  StripeElementStyle,
} from '@stripe/stripe-js';
import { AlertCircle, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CardBrandIcon, cardBrandLabel } from '@/components/checkout/CardBrandIcon';
import { WalletPaymentButton } from '@/components/checkout/WalletPaymentButton';
import { friendlyStripeError } from '@/lib/stripe/errors';
import { simulatePaymentConfirmation } from '@/lib/stripe/simulate';
import { isStripeConfigured } from '@/lib/stripe/client';
import { cn, formatUsdc } from '@/lib/utils';

type PaymentMethodChoice = 'card' | 'paypal';
type Status = 'idle' | 'processing' | 'succeeded';

export interface BillingDetails {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentFormProps {
  /** Order total, used on the pay button and the Apple Pay / Google Pay sheet. */
  amount: number;
  /** ISO currency of `amount`; checkout prices are in US dollars. */
  currency?: string;
  /**
   * Confirms the charge once Stripe has tokenised the card (or the wallet has
   * returned a payment method). Wire this to the
   * PaymentIntent endpoint when it exists; until then the form falls back to
   * `simulatePaymentConfirmation`.
   */
  onConfirmPayment?: (paymentMethod: PaymentMethod) => Promise<void>;
  onSuccess?: (paymentMethod: PaymentMethod) => void;
  /** Called when the learner commits to PayPal instead of a card. */
  onPayPalSelected?: () => void;
  className?: string;
}

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
];

const ELEMENT_STYLE: StripeElementStyle = {
  base: {
    color: '#1a1208',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '15px',
    fontWeight: '400',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#8b7d6b' },
  },
  invalid: { color: '#be123c', iconColor: '#be123c' },
};

const FIELD_CLASS =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-hamplard-primary focus:outline-none focus:ring-2 focus:ring-hamplard-primary/30 disabled:bg-ink-50 disabled:text-ink-500';

const ELEMENT_WRAPPER_CLASS =
  'rounded-lg border border-ink-200 bg-white px-3 py-3 transition-colors focus-within:border-hamplard-primary focus-within:ring-2 focus-within:ring-hamplard-primary/30';

const EMPTY_BILLING: BillingDetails = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'NG',
};

/** Blank message so the label reads as required without repeating the field name. */
const REQUIRED = 'This field is required.';

export function PaymentForm({
  amount,
  currency = 'usd',
  onConfirmPayment,
  onSuccess,
  onPayPalSelected,
  className,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const fieldId = useId();

  const [method, setMethod] = useState<PaymentMethodChoice>('card');
  const [billing, setBilling] = useState<BillingDetails>(EMPTY_BILLING);
  const [brand, setBrand] = useState('unknown');
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [payPalNotice, setPayPalNotice] = useState<string | null>(null);
  /** True while the Apple Pay / Google Pay sheet is open over the page. */
  const [walletOpen, setWalletOpen] = useState(false);

  /** Live validation straight from Stripe, per card field. */
  const [cardErrors, setCardErrors] = useState<Record<string, string | null>>({});
  const [cardComplete, setCardComplete] = useState<Record<string, boolean>>({});
  /** Our own text fields. */
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BillingDetails, string>>>({});

  const errorRef = useRef<HTMLDivElement>(null);
  const isProcessing = status === 'processing';
  const isBusy = isProcessing || walletOpen;
  const isDone = status === 'succeeded';
  const stripeUnavailable = !isStripeConfigured();

  const updateBilling = (key: keyof BillingDetails, value: string) => {
    setBilling((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleElementChange =
    (key: 'cardNumber' | 'cardExpiry' | 'cardCvc') =>
    (event: StripeElementChangeEvent | StripeCardNumberElementChangeEvent) => {
      setCardErrors((prev) => ({ ...prev, [key]: event.error ? event.error.message : null }));
      setCardComplete((prev) => ({ ...prev, [key]: event.complete }));
      if ('brand' in event) setBrand(event.brand);
    };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof BillingDetails, string>> = {};
    if (!billing.name.trim()) errors.name = 'Enter the name printed on your card.';
    if (!billing.line1.trim()) errors.line1 = REQUIRED;
    if (!billing.city.trim()) errors.city = REQUIRED;
    if (!billing.postalCode.trim()) errors.postalCode = REQUIRED;

    const missingCard: Record<string, string> = {};
    if (!cardComplete.cardNumber) missingCard.cardNumber = 'Enter your full card number.';
    if (!cardComplete.cardExpiry) missingCard.cardExpiry = 'Enter the expiry date.';
    if (!cardComplete.cardCvc) missingCard.cardCvc = 'Enter the security code.';

    setFieldErrors(errors);
    setCardErrors((prev) => ({ ...prev, ...missingCard }));

    return Object.keys(errors).length === 0 && Object.keys(missingCard).length === 0;
  };

  const failWith = (message: string) => {
    setFormError(message);
    setStatus('idle');
    // Move focus so the decline is announced instead of silently appearing above the fold.
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    const cardNumberElement = elements?.getElement(CardNumberElement);
    if (!stripe || !cardNumberElement) {
      failWith('Card payments are still loading. Give it a second and try again.');
      return;
    }

    setStatus('processing');

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: billing.name.trim(),
        address: {
          line1: billing.line1.trim(),
          line2: billing.line2.trim() || undefined,
          city: billing.city.trim(),
          state: billing.state.trim() || undefined,
          postal_code: billing.postalCode.trim(),
          country: billing.country,
        },
      },
    });

    if (error || !paymentMethod) {
      failWith(friendlyStripeError(error));
      return;
    }

    try {
      await confirmPayment(paymentMethod);
      handlePaymentSucceeded(paymentMethod);
    } catch (confirmError) {
      failWith(friendlyStripeError(confirmError));
    }
  };

  const confirmPayment = (paymentMethod: PaymentMethod) =>
    (onConfirmPayment ?? simulatePaymentConfirmation)(paymentMethod);

  const handlePaymentSucceeded = (paymentMethod: PaymentMethod) => {
    setStatus('succeeded');
    onSuccess?.(paymentMethod);
  };

  const handleWalletSheetOpenChange = (open: boolean) => {
    setWalletOpen(open);
    if (open) setFormError(null);
  };

  const handlePayPal = () => {
    if (onPayPalSelected) {
      onPayPalSelected();
      return;
    }
    setPayPalNotice(
      'PayPal checkout opens once the payment service is connected. Pay by card to complete this order today.',
    );
  };

  if (isDone) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-leaf-500/30 bg-leaf-50 p-6 text-center sm:p-8',
          className,
        )}
        role="status"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-leaf-600" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-ink-900">Payment successful</h2>
        <p className="mt-1 text-sm text-ink-700">
          We&apos;ve charged {formatUsdc(amount)}. Your courses are unlocking now.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isBusy}
      className={cn('space-y-6', className)}
    >
      {/* Payment method choice */}
      <fieldset className="space-y-3" disabled={isBusy}>
        <legend className="text-sm font-semibold text-ink-900">Payment method</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { value: 'card', label: 'Credit or debit card', hint: 'Visa, Mastercard, Amex' },
              { value: 'paypal', label: 'PayPal', hint: 'Pay with your PayPal balance' },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                method === option.value
                  ? 'border-hamplard-primary bg-hamplard-lilac/50'
                  : 'border-ink-200 hover:bg-ink-50',
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={option.value}
                checked={method === option.value}
                onChange={() => {
                  setMethod(option.value);
                  setFormError(null);
                  setPayPalNotice(null);
                }}
                className="mt-1 h-4 w-4 accent-hamplard-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-ink-900">{option.label}</span>
                <span className="block text-xs text-ink-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {stripeUnavailable && method === 'card' && (
        <p className="flex items-start gap-2 rounded-lg border border-saffron-200 bg-saffron-50 p-3 text-sm text-saffron-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Card payments are not configured in this environment. Set
          <code className="mx-1 font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to
          enable them.
        </p>
      )}

      {method === 'card' ? (
        <>
          <WalletPaymentButton
            amount={amount}
            currency={currency}
            disabled={isBusy}
            confirmPayment={confirmPayment}
            onSuccess={handlePaymentSucceeded}
            onError={(walletError) => failWith(friendlyStripeError(walletError))}
            onSheetOpenChange={handleWalletSheetOpenChange}
          />

          <fieldset className="space-y-4" disabled={isBusy}>
            <legend className="text-sm font-semibold text-ink-900">Card details</legend>

            <div>
              <label htmlFor={`${fieldId}-name`} className="mb-1.5 block text-sm text-ink-700">
                Cardholder name
              </label>
              <input
                id={`${fieldId}-name`}
                type="text"
                autoComplete="cc-name"
                placeholder="Name as printed on the card"
                value={billing.name}
                onChange={(event) => updateBilling('name', event.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? `${fieldId}-name-error` : undefined}
                className={cn(FIELD_CLASS, fieldErrors.name && 'border-rose-500')}
              />
              <FieldError id={`${fieldId}-name-error`} message={fieldErrors.name} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-ink-700" id={`${fieldId}-number-label`}>
                  Card number
                </span>
                <span className="flex items-center gap-2 text-xs text-ink-500">
                  <CardBrandIcon brand={brand} />
                  <span aria-live="polite">
                    {brand === 'unknown' ? 'Detecting…' : cardBrandLabel(brand)}
                  </span>
                </span>
              </div>
              <div
                className={cn(
                  ELEMENT_WRAPPER_CLASS,
                  cardErrors.cardNumber && 'border-rose-500',
                  isBusy && 'bg-ink-50',
                )}
              >
                <CardNumberElement
                  options={{ style: ELEMENT_STYLE, showIcon: false, disabled: isBusy }}
                  onChange={handleElementChange('cardNumber')}
                />
              </div>
              <FieldError id={`${fieldId}-number-error`} message={cardErrors.cardNumber} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-sm text-ink-700">Expiry date</span>
                <div
                  className={cn(
                    ELEMENT_WRAPPER_CLASS,
                    cardErrors.cardExpiry && 'border-rose-500',
                    isBusy && 'bg-ink-50',
                  )}
                >
                  <CardExpiryElement
                    options={{ style: ELEMENT_STYLE, disabled: isBusy }}
                    onChange={handleElementChange('cardExpiry')}
                  />
                </div>
                <FieldError id={`${fieldId}-expiry-error`} message={cardErrors.cardExpiry} />
              </div>

              <div>
                <span className="mb-1.5 block text-sm text-ink-700">Security code (CVC)</span>
                <div
                  className={cn(
                    ELEMENT_WRAPPER_CLASS,
                    cardErrors.cardCvc && 'border-rose-500',
                    isBusy && 'bg-ink-50',
                  )}
                >
                  <CardCvcElement
                    options={{ style: ELEMENT_STYLE, disabled: isBusy }}
                    onChange={handleElementChange('cardCvc')}
                  />
                </div>
                <FieldError id={`${fieldId}-cvc-error`} message={cardErrors.cardCvc} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4" disabled={isBusy}>
            <legend className="text-sm font-semibold text-ink-900">Billing address</legend>

            <div>
              <label htmlFor={`${fieldId}-line1`} className="mb-1.5 block text-sm text-ink-700">
                Street address
              </label>
              <input
                id={`${fieldId}-line1`}
                type="text"
                autoComplete="billing address-line1"
                placeholder="12 Awolowo Road"
                value={billing.line1}
                onChange={(event) => updateBilling('line1', event.target.value)}
                aria-invalid={Boolean(fieldErrors.line1)}
                aria-describedby={fieldErrors.line1 ? `${fieldId}-line1-error` : undefined}
                className={cn(FIELD_CLASS, fieldErrors.line1 && 'border-rose-500')}
              />
              <FieldError id={`${fieldId}-line1-error`} message={fieldErrors.line1} />
            </div>

            <div>
              <label htmlFor={`${fieldId}-line2`} className="mb-1.5 block text-sm text-ink-700">
                Apartment, suite, floor <span className="text-ink-500">(optional)</span>
              </label>
              <input
                id={`${fieldId}-line2`}
                type="text"
                autoComplete="billing address-line2"
                value={billing.line2}
                onChange={(event) => updateBilling('line2', event.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${fieldId}-city`} className="mb-1.5 block text-sm text-ink-700">
                  City
                </label>
                <input
                  id={`${fieldId}-city`}
                  type="text"
                  autoComplete="billing address-level2"
                  value={billing.city}
                  onChange={(event) => updateBilling('city', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.city)}
                  aria-describedby={fieldErrors.city ? `${fieldId}-city-error` : undefined}
                  className={cn(FIELD_CLASS, fieldErrors.city && 'border-rose-500')}
                />
                <FieldError id={`${fieldId}-city-error`} message={fieldErrors.city} />
              </div>

              <div>
                <label htmlFor={`${fieldId}-state`} className="mb-1.5 block text-sm text-ink-700">
                  State or region <span className="text-ink-500">(optional)</span>
                </label>
                <input
                  id={`${fieldId}-state`}
                  type="text"
                  autoComplete="billing address-level1"
                  value={billing.state}
                  onChange={(event) => updateBilling('state', event.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${fieldId}-postal`} className="mb-1.5 block text-sm text-ink-700">
                  Postal code
                </label>
                <input
                  id={`${fieldId}-postal`}
                  type="text"
                  autoComplete="billing postal-code"
                  value={billing.postalCode}
                  onChange={(event) => updateBilling('postalCode', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.postalCode)}
                  aria-describedby={
                    fieldErrors.postalCode ? `${fieldId}-postal-error` : undefined
                  }
                  className={cn(FIELD_CLASS, fieldErrors.postalCode && 'border-rose-500')}
                />
                <FieldError id={`${fieldId}-postal-error`} message={fieldErrors.postalCode} />
              </div>

              <div>
                <label htmlFor={`${fieldId}-country`} className="mb-1.5 block text-sm text-ink-700">
                  Country
                </label>
                <select
                  id={`${fieldId}-country`}
                  autoComplete="billing country"
                  value={billing.country}
                  onChange={(event) => updateBilling('country', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        </>
      ) : (
        <div className="space-y-3 rounded-xl border border-ink-200 bg-ink-50 p-6 text-center">
          <p className="text-sm text-ink-700">
            You&apos;ll be taken to PayPal to approve this payment, then brought straight back.
          </p>
          <button
            type="button"
            onClick={handlePayPal}
            className="w-full rounded-full bg-[#FFC439] px-6 py-3 text-base font-bold text-[#003087] transition-colors hover:bg-[#F0B429] focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-offset-2"
          >
            <span className="italic">Pay</span>
            <span className="italic text-[#0070BA]">Pal</span>
            <span className="sr-only"> — continue to PayPal</span>
          </button>
          {payPalNotice && (
            <p role="status" className="text-xs text-ink-600">
              {payPalNotice}
            </p>
          )}
        </div>
      )}

      {/* Submit-level errors: declines, network failures, config problems. */}
      {formError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 outline-none"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Payment not completed</p>
            <p className="mt-0.5 text-sm text-rose-800">{formError}</p>
          </div>
        </div>
      )}

      {method === 'card' && (
        <div className="space-y-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isProcessing}
            loadingText="Processing payment…"
            disabled={!stripe || stripeUnavailable || walletOpen}
            icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          >
            Pay {formatUsdc(amount)}
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-ink-500">
            <ShieldCheck className="h-4 w-4 text-leaf-600" aria-hidden="true" />
            Secured by Stripe. Card details are encrypted and never touch Hamplard&apos;s servers.
          </p>
        </div>
      )}
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-rose-700">
      {message}
    </p>
  );
}

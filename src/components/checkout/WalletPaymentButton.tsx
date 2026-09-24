'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import type {
  PaymentMethod,
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  StripePaymentRequestButtonElementClickEvent,
} from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

type Wallet = 'applePay' | 'googlePay';

const WALLET_LABELS: Record<Wallet, string> = {
  applePay: 'Apple Pay',
  googlePay: 'Google Pay',
};

export interface WalletPaymentButtonProps {
  /** Order total in major units (e.g. 49.99), same figure the card form charges. */
  amount: number;
  /** ISO currency code, lower-case as Stripe expects. */
  currency?: string;
  /** Two-letter country of the Stripe account. */
  country?: string;
  /** Line shown on the wallet sheet next to the total. */
  label?: string;
  disabled?: boolean;
  /** Charges the wallet's payment method. Throw to report a failure. */
  confirmPayment: (paymentMethod: PaymentMethod) => Promise<void>;
  onSuccess: (paymentMethod: PaymentMethod) => void;
  onError: (error: unknown) => void;
  /** Fires with `true` when the wallet sheet opens and `false` once it closes. */
  onSheetOpenChange?: (open: boolean) => void;
}

/** Stripe wants the smallest currency unit; every currency we sell in has cents. */
const toMinorUnits = (amount: number) => Math.round(amount * 100);

/**
 * Apple Pay / Google Pay via Stripe's Payment Request Button. Renders nothing
 * until `canMakePayment()` confirms a wallet is set up on this device, so the
 * card form stays the only option everywhere else.
 */
export function WalletPaymentButton({
  amount,
  currency = 'usd',
  country = 'US',
  label = 'Hamplard courses',
  disabled = false,
  confirmPayment,
  onSuccess,
  onError,
  onSheetOpenChange,
}: WalletPaymentButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The Payment Request is created once per Stripe instance; later amount
  // changes go through `update()`, so keep the latest values in a ref.
  const latest = useRef({ amount, label, confirmPayment, onSuccess, onError, onSheetOpenChange });
  latest.current = { amount, label, confirmPayment, onSuccess, onError, onSheetOpenChange };

  const setOpen = (open: boolean) => {
    setSheetOpen(open);
    latest.current.onSheetOpenChange?.(open);
  };

  useEffect(() => {
    if (!stripe) return;

    let cancelled = false;
    const request = stripe.paymentRequest({
      country,
      currency,
      total: { label: latest.current.label, amount: toMinorUnits(latest.current.amount) },
      requestPayerName: true,
      requestPayerEmail: true,
      // Only surface the device wallets this feature is about.
      disableWallets: ['link', 'browserCard'],
    });

    request
      .canMakePayment()
      .then((result) => {
        if (cancelled || !result) return;
        const available = (['applePay', 'googlePay'] as const).find((key) => result[key]);
        if (!available) return;
        setWallet(available);
        setPaymentRequest(request);
      })
      .catch(() => {
        // No wallet support is the normal case on most desktops — fall back silently.
      });

    return () => {
      cancelled = true;
      setPaymentRequest(null);
      setWallet(null);
    };
  }, [stripe, country, currency]);

  useEffect(() => {
    paymentRequest?.update({ total: { label, amount: toMinorUnits(amount) } });
  }, [paymentRequest, amount, label]);

  useEffect(() => {
    if (!paymentRequest) return;

    const handlePaymentMethod = async (event: PaymentRequestPaymentMethodEvent) => {
      const { confirmPayment: confirm, onSuccess: succeed, onError: fail } = latest.current;
      try {
        await confirm(event.paymentMethod);
        event.complete('success');
        setOpen(false);
        succeed(event.paymentMethod);
      } catch (error) {
        event.complete('fail');
        setOpen(false);
        fail(error);
      }
    };
    const handleCancel = () => setOpen(false);

    paymentRequest.on('paymentmethod', handlePaymentMethod);
    paymentRequest.on('cancel', handleCancel);
    return () => {
      paymentRequest.off('paymentmethod', handlePaymentMethod);
      paymentRequest.off('cancel', handleCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentRequest]);

  if (!paymentRequest || !wallet) return null;

  const handleClick = (event: StripePaymentRequestButtonElementClickEvent) => {
    if (disabled || sheetOpen) {
      event.preventDefault();
      return;
    }
    setOpen(true);
  };

  return (
    <div className="space-y-4" data-testid="wallet-payment">
      <div className={disabled && !sheetOpen ? 'pointer-events-none opacity-60' : undefined}>
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: { paymentRequestButton: { type: 'buy', theme: 'dark', height: '48px' } },
          }}
          onClick={handleClick}
        />
      </div>

      {sheetOpen && (
        <p role="status" className="flex items-center justify-center gap-2 text-sm text-ink-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Waiting for {WALLET_LABELS[wallet]}…
        </p>
      )}

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-500">
        <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
        or pay with card
        <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
      </div>
    </div>
  );
}

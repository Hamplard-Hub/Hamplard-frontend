'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripe/client';

const stripePromise = getStripe();

/** Same face the rest of the app loads in globals.css, so the card iframes match. */
const options: StripeElementsOptions = {
  fonts: [
    {
      cssSrc:
        'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap',
    },
  ],
};

/**
 * Wraps the checkout in Stripe's Elements context — the card fields, the
 * Apple Pay / Google Pay button and the saved-card form all read the Stripe
 * instance from here. Resolves to `null` when
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is unset — children still render,
 * `PaymentForm` shows an unavailable notice instead of a dead form, and the
 * wallet button stays hidden.
 */
export function StripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

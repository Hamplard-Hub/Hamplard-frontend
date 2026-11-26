'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Dynamically imported StripeProvider to reduce initial bundle size.
 * The Stripe SDK (~50KB) is only loaded when the checkout page is accessed.
 */
const StripeProviderLazy = dynamic(
  () => import('./StripeProvider').then((mod) => ({ default: mod.StripeProvider })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-hamplard-primary mb-3" />
          <p className="text-sm text-ink-500">Loading payment form...</p>
        </div>
      </div>
    ),
    ssr: false, // Stripe requires browser environment
  }
);

export function StripeProviderDynamic({ children }: { children: React.ReactNode }) {
  return <StripeProviderLazy>{children}</StripeProviderLazy>;
}

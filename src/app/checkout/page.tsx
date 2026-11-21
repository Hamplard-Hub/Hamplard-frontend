import type { Metadata } from 'next';
import { TopBar } from '@/components/layout/TopBar';
import { CheckoutContent } from '@/components/checkout/CheckoutContent';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Hamplard course purchase securely with card or PayPal.',
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10 xl:px-10">
        <CheckoutContent />
      </main>
    </div>
  );
}

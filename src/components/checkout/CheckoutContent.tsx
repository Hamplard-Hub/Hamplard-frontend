'use client';

import { useState } from 'react';
import type { PaymentMethod } from '@stripe/stripe-js';
import { ArrowLeft } from 'lucide-react';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { StripeProvider } from '@/components/checkout/StripeProvider';
import { StepProgress, type CheckoutStep } from '@/components/checkout/StepProgress';
import { OrderReview } from '@/components/checkout/OrderReview';
import { ConfirmationStep } from '@/components/checkout/ConfirmationStep';
import { useCartStore, type CartItem } from '@/lib/hooks/use-cart-store';
import { formatUsdc } from '@/lib/utils';

export function CheckoutContent() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    transactionId: string;
  } | null>(null);

  const subtotal = getTotalPrice();
  const platformFee = subtotal * 0.025;
  const total = subtotal + platformFee - promoDiscount;

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as CheckoutStep);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckoutStep);
    }
  };

  const handlePaymentSuccess = (_paymentMethod: PaymentMethod) => {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setReceipt({ items, total, transactionId });
    clearCart();
    setCurrentStep(3);
  };

  return (
    <div className="space-y-8">
      {/* Step progress indicator */}
      <StepProgress currentStep={currentStep} className="max-w-xl mx-auto" />

      {/* Back navigation (hidden on step 1 and 3) */}
      {currentStep === 2 && (
        <div className="flex items-center justify-start">
          <button
            onClick={handlePreviousStep}
            className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 transition-colors focus:outline-none focus:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to order review
          </button>
        </div>
      )}

      {/* Step 1: Order Review */}
      {currentStep === 1 && (
        <OrderReview
          onNext={(discount) => {
            setPromoDiscount(discount);
            handleNextStep();
          }}
        />
      )}

      {/* Step 2: Payment */}
      {currentStep === 2 && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-xl font-semibold text-ink-900">Payment</h1>
            <p className="mt-1 text-sm text-ink-600">
              Enter your card details to complete the purchase.
            </p>

            <StripeProvider>
              <PaymentForm amount={total} onSuccess={handlePaymentSuccess} className="mt-6" />
            </StripeProvider>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold text-ink-900">Order summary</h2>

              <ul className="mt-4 space-y-3 border-b border-ink-100 pb-4">
                {items.map((item) => (
                  <li key={item.courseId} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-ink-700">{item.course.title}</span>
                    <span className="shrink-0 text-sm font-medium text-ink-900">
                      {formatUsdc(item.course.price)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900">Total</span>
                <span className="text-xl font-bold text-hamplard-primary">{formatUsdc(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && receipt && <ConfirmationStep receipt={receipt} />}
    </div>
  );
}

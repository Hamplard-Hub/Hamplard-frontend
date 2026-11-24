'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { StripeProvider } from '@/components/checkout/StripeProvider';
import { StepProgress, type CheckoutStep } from '@/components/checkout/StepProgress';
import { OrderReview } from '@/components/checkout/OrderReview';
import { ConfirmationStep } from '@/components/checkout/ConfirmationStep';
import { useCartStore, type CartItem } from '@/lib/hooks/use-cart-store';
import { centsToDisplay, percentOf, applyDiscount, priceInCents } from '@/lib/utils/money';
import type { PaymentMethod } from '@stripe/stripe-js';

export function CheckoutContent() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [promoCents, setPromoCents] = useState(0);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    totalCents: number;
    orderId: string;
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const subtotalCents = getTotalPrice();
  const platformFeeCents = percentOf(subtotalCents, 2.5); // 2.5% platform fee
  const totalCents = applyDiscount(subtotalCents + platformFeeCents, promoCents);

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

  const handlePaymentSuccess = async (paymentMethod: PaymentMethod) => {
    try {
      // Create order on backend
      const orderId = await createOrder({
        items,
        totalCents,
        paymentMethodId: paymentMethod.id,
        promoCode: promoCents > 0 ? 'applied' : undefined,
      });

      setReceipt({
        items,
        totalCents,
        orderId,
      });
      clearCart();
      setCurrentStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order. Please contact support.';
      setPaymentError(message);
    }
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
            className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 rounded transition-colors focus:outline-none focus:underline focus-visible:ring-2 focus-visible:ring-hamplard-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to order review
          </button>
        </div>
      )}

      {/* Step 1: Order Review */}
      {currentStep === 1 && (
        <OrderReview
          onNext={(discountCents) => {
            setPromoCents(discountCents);
            setPaymentError(null);
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
              Pay with Apple Pay, Google Pay, or your card to complete the purchase.
            </p>

            {paymentError && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm text-rose-800">{paymentError}</p>
              </div>
            )}

            <StripeProvider>
              <PaymentForm
                amount={totalCents}
                onSuccess={handlePaymentSuccess}
                className="mt-6"
              />
            </StripeProvider>
          </section>

          {/* Order summary sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold text-ink-900">Order summary</h2>

              <ul className="mt-4 space-y-3 border-b border-ink-100 pb-4">
                {items.map((item) => (
                  <li key={item.courseId} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-ink-700">{item.course.title}</span>
                    <span className="shrink-0 text-sm font-medium text-ink-900">
                      {centsToDisplay(priceInCents(item.course.price))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2 text-sm text-ink-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{centsToDisplay(subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee (2.5%)</span>
                  <span>{centsToDisplay(platformFeeCents)}</span>
                </div>
                {promoCents > 0 && (
                  <div className="flex justify-between text-leaf-700">
                    <span>Discount</span>
                    <span>-{centsToDisplay(promoCents)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-4">
                <span className="text-base font-semibold text-ink-900">Total</span>
                <span className="text-xl font-bold text-hamplard-primary">{centsToDisplay(totalCents)}</span>
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

/**
 * Create an order on the backend.
 * This should integrate with your actual backend API once available.
 */
async function createOrder(payload: {
  items: CartItem[];
  totalCents: number;
  paymentMethodId: string;
  promoCode?: string;
}): Promise<string> {
  // TODO: Replace with actual backend API call once payment service is integrated
  // For now, this returns a mock order ID
  if (!payload.items.length) {
    throw new Error('No items in order');
  }

  // Simulate backend call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // In production, this would be: const { data } = await apiClient.post('/orders', payload);
      // return data.orderId;
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      if (orderId) {
        resolve(orderId);
      } else {
        reject(new Error('Failed to create order'));
      }
    }, 500);
  });
}

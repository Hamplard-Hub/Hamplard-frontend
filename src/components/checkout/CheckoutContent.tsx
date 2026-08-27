'use client';

import { useState } from 'react';
import type { PaymentMethod } from '@stripe/stripe-js';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { StripeProvider } from '@/components/checkout/StripeProvider';
import { StepProgress, type CheckoutStep } from '@/components/checkout/StepProgress';
import { OrderReview } from '@/components/checkout/OrderReview';
import { ConfirmationStep } from '@/components/checkout/ConfirmationStep';
import { CheckCircle2, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { StripeProvider } from '@/components/checkout/StripeProvider';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { useCartStore, type CartItem } from '@/lib/hooks/use-cart-store';
import { formatUsdc } from '@/lib/utils';

const STEPS = [
  { label: 'Review', description: 'Review your order' },
  { label: 'Payment', description: 'Pay with card or PayPal' },
  { label: 'Confirmation', description: 'Order confirmed' },
];

export function CheckoutContent() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    transactionId: string;
  } | null>(null);
  const { items, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [receipt, setReceipt] = useState<{ items: CartItem[]; total: number } | null>(null);

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

  const handlePaymentSuccess = (paymentMethod: PaymentMethod) => {
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
  if (receipt) {
    return (
      <>
        <CheckoutSteps steps={STEPS} currentStep={3} />
        <section className="mx-auto max-w-2xl rounded-2xl border border-leaf-500/30 bg-white p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-12 w-12 text-leaf-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">Payment received</h1>
          <p className="mt-2 text-ink-600">
            We&apos;ve charged {formatUsdc(receipt.total)}. You now have access to{' '}
            {receipt.items.length} course{receipt.items.length === 1 ? '' : 's'}.
          </p>

          <ul className="mt-6 space-y-2 text-left">
            {receipt.items.map((item) => (
              <li
                key={item.courseId}
                className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-ink-900">{item.course.title}</span>
                <span className="text-sm text-ink-600">{formatUsdc(item.course.price)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/courses">
              <Button variant="primary" size="lg">
                Start learning
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="tertiary" size="lg">
                Browse more courses
              </Button>
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-ink-200 bg-white p-10 text-center shadow-card">
        <ShoppingBag className="mx-auto h-12 w-12 text-ink-200" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-ink-900">There&apos;s nothing to pay for</h1>
        <p className="mt-2 text-sm text-ink-600">
          Add a course to your cart and it will show up here, ready for checkout.
        </p>
        <Link href="/courses" className="mt-6 inline-block">
          <Button variant="primary" size="lg">
            Browse courses
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <>
      <CheckoutSteps steps={STEPS} currentStep={step} />

      {step === 1 && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-xl font-semibold text-ink-900">Review your order</h1>
            <p className="mt-1 text-sm text-ink-600">
              Check the items below before proceeding to payment.
            </p>

            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li
                  key={item.courseId}
                  className="flex items-start justify-between gap-3 rounded-lg border border-ink-100 p-4"
                >
                  <div className="flex items-start gap-3">
                    {item.course.thumbnailUrl ? (
                      <img
                        src={item.course.thumbnailUrl}
                        alt={`${item.course.title} thumbnail`}
                        className="h-14 w-14 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-saffron-100 to-saffron-200">
                        <span className="text-lg">📚</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium uppercase text-saffron-600">
                        {item.course.category}
                      </p>
                      <h3 className="text-sm font-semibold text-ink-900">{item.course.title}</h3>
                      <p className="text-xs text-ink-500">
                        by {item.course.instructor?.name || 'Hamplard Instructor'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-sm font-bold text-ink-900">
                      {formatUsdc(item.course.price)}
                    </span>
                    <button
                      onClick={() => removeItem(item.courseId)}
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.course.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold text-ink-900">Order summary</h2>

              <div className="mt-4 space-y-2 border-b border-ink-100 pb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">
                    Subtotal ({items.length} course{items.length !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium text-ink-900">{formatUsdc(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">Platform fee</span>
                  <span className="text-ink-500">Calculated at checkout</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900">Total</span>
                <span className="text-xl font-bold text-hamplard-primary">{formatUsdc(total)}</span>
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  fullWidth
                  variant="primary"
                  size="lg"
                  onClick={() => setStep(2)}
                >
                  Continue to Payment
                </Button>
                <button
                  onClick={clearCart}
                  className="w-full px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:text-red-600"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
            <button
              onClick={() => setStep(1)}
              className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to review
            </button>

            <h1 className="text-xl font-semibold text-ink-900">Payment</h1>
            <p className="mt-1 text-sm text-ink-600">
              Enter your card details to complete the purchase.
            </p>

            <StripeProvider>
              <PaymentForm amount={total} onSuccess={handlePaymentSuccess} className="mt-6" />
            </StripeProvider>
          </section>

          {/* Order summary sidebar */}
              <PaymentForm amount={total} onSuccess={handleSuccess} className="mt-6" />
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
    </>
  );
}



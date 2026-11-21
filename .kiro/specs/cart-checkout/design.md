# Technical Design - Shopping Cart and Checkout Flow

## Overview

A frictionless shopping cart and multi-step checkout experience for Hamplard course purchases. The implementation spans cart listing, promo code validation, and a three-step checkout flow (Review, Payment, Confirmation) with clear error states and mobile-responsive layouts.

---

## Routes and Pages

```
/cart                       → src/app/dashboard/cart/page.tsx
/checkout                   → src/app/dashboard/checkout/page.tsx
```

The cart is stored in Redux/Context state (not persisted to backend until checkout). Checkout is a client-side multi-step form.

---

## Data Types

```ts
interface CartItem {
  courseId: string;
  course: Course;            // full course object with pricing
  quantity: number;          // always 1 for courses (but structure allows flexibility)
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;     // percentage (0-100)
  appliedPromoCode: string | null;
  subtotal: number;          // sum of (course.price * quantity)
  discount: number;          // currency amount after promo applied
  total: number;             // subtotal - discount
}

interface CheckoutSession {
  step: 'review' | 'payment' | 'confirmation';
  courses: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedPromoCode: string | null;
  paymentMethod: 'card' | 'paypal' | null;
  cardData?: {
    fullName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    billingAddress: string;
    billingZip: string;
  };
  paypalData?: {
    email: string;
    paypalOrderId: string;
  };
  transactionHash?: string;  // post-payment
  enrollmentIds?: string[];  // post-enrollment API calls
}

interface PromoCodeValidation {
  isValid: boolean;
  discountPercent?: number;
  message: string;
}
```

---

## State Management

Use React Context or Redux for:
1. Cart items + total calculations
2. Active checkout step
3. Form data persistence across step navigation
4. API loading and error states

Example Context API approach:

```ts
interface CartContextType {
  cart: CartState;
  checkout: CheckoutSession;
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => void;
  updateCheckoutStep: (step: CheckoutSession['step']) => void;
  updatePaymentData: (data: Partial<CheckoutSession>) => void;
  completeCheckout: (txHash: string, enrollmentIds: string[]) => void;
  resetCart: () => void;
}
```

---

## Cart Page (`/cart`)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [logo]  Navigation                                 [×]   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Shopping Cart                              [Back to Store]│
│                                                           │
│  ┌─────────────────────────────────────────┐ ┌─────────┐│
│  │ Course Card (thumbnail, title, price)   │ │ Order   ││
│  │ [× Remove]                              │ │ Summary ││
│  │                                         │ │         ││
│  │ Course Card 2                          │ │ Subtotal││
│  │ [× Remove]                              │ │ $199.99 ││
│  │                                         │ │ Promo   ││
│  │ Promo Code:                            │ │ -$20.00 ││
│  │ [Input Box] [Apply]                     │ │         ││
│  │ [Promo Applied] ✓ or Error msg         │ │ Total   ││
│  │                                         │ │ $179.99 ││
│  │                                         │ │         ││
│  │                                         │ │[Checkout]│
│  └─────────────────────────────────────────┘ └─────────┘│
│                                                           │
│                                  [Footer]                │
└──────────────────────────────────────────────────────────┘
```

### Desktop Layout

- Left column: `flex-1` course list with thumbnails (100x100 on desktop)
- Right column: `w-80` sticky order summary (top: nav height)
- Promo code section: below course list, inline form

### Mobile Layout (375px)

- Single column, full width
- Thumbnails: 60x60px
- Order summary: collapsed/expandable or sticky at bottom
- Promo code: full width input

### Components

#### CartPage (page.tsx)

```ts
export default function CartPage() {
  const { cart, removeFromCart, applyPromoCode, removePromoCode } = useCart();
  const router = useRouter();

  if (cart.items.length === 0) {
    return <EmptyCartState onContinue={() => router.push('/')} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 px-4">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <CartItemsList 
          items={cart.items} 
          onRemove={removeFromCart}
        />
        
        <PromoCodeSection
          currentCode={cart.appliedPromoCode}
          onApply={applyPromoCode}
          onRemove={removePromoCode}
          error={cart.promoError}
        />
      </div>

      <div className="lg:col-span-1">
        <OrderSummary
          cart={cart}
          onCheckout={() => router.push('/checkout')}
        />
      </div>
    </div>
  );
}
```

#### CartItemsList

```ts
interface CartItemsListProps {
  items: CartItem[];
  onRemove: (courseId: string) => void;
}

export function CartItemsList({ items, onRemove }: CartItemsListProps) {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <div
          key={item.courseId}
          className="flex gap-4 pb-4 border-b last:border-b-0"
        >
          {/* Thumbnail */}
          <img
            src={item.course.thumbnailUrl || ''}
            alt={item.course.title}
            className="w-24 h-24 lg:w-28 lg:h-28 rounded object-cover"
          />

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{item.course.title}</h3>
            <p className="text-sm text-ink-600">
              {item.course.instructor.name}
            </p>
            <p className="text-2xl font-bold text-saffron-600 mt-2">
              ${item.course.price}
            </p>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.courseId)}
            className="text-red-500 hover:text-red-700 text-xl"
            aria-label="Remove from cart"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### PromoCodeSection

```ts
interface PromoCodeSectionProps {
  currentCode: string | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => void;
  error?: string;
}

export function PromoCodeSection({
  currentCode,
  onApply,
  onRemove,
  error,
}: PromoCodeSectionProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await onApply(code.trim());
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
      <label className="block text-sm font-semibold mb-3">
        Promo Code
      </label>

      {currentCode ? (
        <div className="flex items-center justify-between p-3 bg-leaf-50 rounded border border-leaf-200">
          <span className="font-mono font-bold text-leaf-700">
            {currentCode}
          </span>
          <button
            onClick={onRemove}
            className="text-leaf-600 hover:text-leaf-700 text-sm font-semibold"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={handleApply}
            className="btn btn-primary"
            disabled={loading || !code.trim()}
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">
          ✕ {error}
        </p>
      )}
    </div>
  );
}
```

#### OrderSummary

```ts
interface OrderSummaryProps {
  cart: CartState;
  onCheckout: () => void;
}

export function OrderSummary({ cart, onCheckout }: OrderSummaryProps) {
  return (
    <div className="sticky top-20 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
      <h3 className="font-bold text-lg mb-6">Order Summary</h3>

      <div className="space-y-3 text-sm mb-6 pb-6 border-b">
        <div className="flex justify-between">
          <span className="text-ink-600">Subtotal</span>
          <span className="font-semibold">${cart.subtotal.toFixed(2)}</span>
        </div>

        {cart.appliedPromoCode && (
          <div className="flex justify-between text-leaf-700">
            <span>{cart.appliedPromoCode} ({cart.promoDiscount}%)</span>
            <span className="font-semibold">
              -${cart.discount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-xl font-bold mb-6">
        <span>Total</span>
        <span className="text-saffron-600">
          ${cart.total.toFixed(2)}
        </span>
      </div>

      <button
        onClick={onCheckout}
        className="btn btn-primary w-full"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
```

#### EmptyCartState

```ts
interface EmptyCartStateProps {
  onContinue: () => void;
}

export function EmptyCartState({ onContinue }: EmptyCartStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-ink-600 mb-6">
        Browse our courses and add them to your cart.
      </p>
      <button
        onClick={onContinue}
        className="btn btn-primary"
      >
        Continue Shopping
      </button>
    </div>
  );
}
```

---

## Checkout Page (`/checkout`)

### Multi-Step Flow

```
Step 1: Review    ─→  Step 2: Payment  ─→  Step 3: Confirmation
 [Active]             [Locked]              [Locked]
   Edit cart          Credit/PayPal        Receipt
   Apply coupon       Billing address      Enroll action
                      Order summary        Next steps
```

### Step 1: Review

**Purpose:** Confirm cart items, allow final promo code adjustments, then proceed to payment.

```
┌──────────────────────────────────────────────────┐
│ Checkout: Step 1 of 3 — Review Order            │
├──────────────────────────────────────────────────┤
│                                                  │
│ Items in this order:                            │
│ ┌────────────────────────────────────────────┐ │
│ │ [Thumb] Course Title              $99.99  │ │
│ │         Instructor Name                   │ │
│ └────────────────────────────────────────────┘ │
│ [+ Add more courses]                            │
│                                                  │
│ [Current promo code section if applied]         │
│                                                  │
│ Subtotal: $99.99                               │
│ Discount: -$0.00                               │
│ Total: $99.99                                  │
│                                                  │
│                      [← Back]  [Next: Payment →]│
└──────────────────────────────────────────────────┘
```

#### CheckoutReviewStep Component

```ts
interface CheckoutReviewStepProps {
  checkout: CheckoutSession;
  onNext: () => void;
  onBack: () => void;
  onEditCart: () => void;
}

export function CheckoutReviewStep({
  checkout,
  onNext,
  onBack,
  onEditCart,
}: CheckoutReviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Checkout: Step 1 of 3 — Review Order
      </h2>

      <div className="bg-neutral-50 p-6 rounded-lg">
        <h3 className="font-bold mb-4">Courses in this order</h3>
        <div className="space-y-4">
          {checkout.courses.map(item => (
            <div key={item.courseId} className="flex gap-4 pb-4 border-b">
              <img
                src={item.course.thumbnailUrl || ''}
                alt={item.course.title}
                className="w-20 h-20 rounded object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold">{item.course.title}</h4>
                <p className="text-sm text-ink-600">
                  {item.course.instructor.name}
                </p>
                <p className="text-lg font-bold text-saffron-600 mt-2">
                  ${item.course.price}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onEditCart}
          className="text-saffron-600 font-semibold hover:text-saffron-700 mt-4"
        >
          + Add more courses
        </button>
      </div>

      {/* Order Summary */}
      <div className="border rounded-lg p-6">
        <h3 className="font-bold mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm mb-4 pb-4 border-b">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${checkout.subtotal.toFixed(2)}</span>
          </div>
          {checkout.appliedPromoCode && (
            <div className="flex justify-between text-leaf-600">
              <span>{checkout.appliedPromoCode} ({checkout.promoDiscount}%)</span>
              <span>-${checkout.discount.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span className="text-saffron-600">${checkout.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
        <button onClick={onNext} className="btn btn-primary">
          Next: Payment →
        </button>
      </div>
    </div>
  );
}
```

### Step 2: Payment

**Purpose:** Collect payment method (credit card or PayPal) and billing address.

```
┌──────────────────────────────────────────────────┐
│ Checkout: Step 2 of 3 — Payment                 │
├──────────────────────────────────────────────────┤
│                                                  │
│ Payment Method:                                 │
│ ◉ Credit / Debit Card                           │
│ ○ PayPal                                        │
│                                                  │
│ [If Credit Card Selected:]                      │
│ Full Name: [_________________]                  │
│ Card Number: [_________________]                │
│ Expiry: [____] CVV: [____]                      │
│ Billing Address: [_________________]            │
│ Zip Code: [_________________]                   │
│                                                  │
│ [If PayPal Selected:]                           │
│ [PayPal Button - Opens OAuth flow]              │
│                                                  │
│            Order Summary (sticky)               │
│            Subtotal: $99.99                     │
│            Total: $99.99                        │
│                                                  │
│                      [← Back]  [Confirm Payment]│
└──────────────────────────────────────────────────┘
```

#### CheckoutPaymentStep Component

```ts
interface CheckoutPaymentStepProps {
  checkout: CheckoutSession;
  onNext: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export function CheckoutPaymentStep({
  checkout,
  onNext,
  onBack,
  isLoading,
  error,
}: CheckoutPaymentStepProps) {
  const [method, setMethod] = useState<'card' | 'paypal'>(
    checkout.paymentMethod || 'card'
  );
  const [cardData, setCardData] = useState(checkout.cardData || {
    fullName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    billingAddress: '',
    billingZip: '',
  });
  const [paypalEmail, setPaypalEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation happens in parent; pass data upward for processing
    await onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Checkout: Step 2 of 3 — Payment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div className="bg-neutral-50 p-6 rounded-lg">
          <h3 className="font-bold mb-4">Payment Method</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="method"
                value="card"
                checked={method === 'card'}
                onChange={() => setMethod('card')}
                className="w-4 h-4"
              />
              <span>Credit / Debit Card</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="method"
                value="paypal"
                checked={method === 'paypal'}
                onChange={() => setMethod('paypal')}
                className="w-4 h-4"
              />
              <span>PayPal</span>
            </label>
          </div>
        </div>

        {/* Card Form */}
        {method === 'card' && (
          <div className="bg-neutral-50 p-6 rounded-lg space-y-4">
            <h3 className="font-bold">Card Details</h3>

            <input
              type="text"
              placeholder="Full Name"
              value={cardData.fullName}
              onChange={(e) =>
                setCardData({ ...cardData, fullName: e.target.value })
              }
              className="input w-full"
              required
            />

            <input
              type="text"
              placeholder="Card Number (16 digits)"
              value={cardData.cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                setCardData({ ...cardData, cardNumber: val });
              }}
              className="input w-full font-mono"
              required
              maxLength={16}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="MM/YY"
                value={cardData.expiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (val.length >= 2) {
                    val = val.slice(0, 2) + '/' + val.slice(2);
                  }
                  setCardData({ ...cardData, expiry: val });
                }}
                className="input w-full font-mono"
                required
                maxLength={5}
              />
              <input
                type="text"
                placeholder="CVV"
                value={cardData.cvv}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCardData({ ...cardData, cvv: val });
                }}
                className="input w-full font-mono"
                required
                maxLength={4}
              />
            </div>

            <h3 className="font-bold text-sm mt-6">Billing Address</h3>

            <input
              type="text"
              placeholder="Street Address"
              value={cardData.billingAddress}
              onChange={(e) =>
                setCardData({ ...cardData, billingAddress: e.target.value })
              }
              className="input w-full"
              required
            />

            <input
              type="text"
              placeholder="Zip Code"
              value={cardData.billingZip}
              onChange={(e) =>
                setCardData({ ...cardData, billingZip: e.target.value })
              }
              className="input w-full"
              required
            />
          </div>
        )}

        {/* PayPal Form */}
        {method === 'paypal' && (
          <div className="bg-neutral-50 p-6 rounded-lg space-y-4">
            <h3 className="font-bold">PayPal Account</h3>
            <button
              type="button"
              className="btn btn-secondary w-full bg-paypal-blue text-white hover:bg-paypal-blue-dark"
            >
              Connect PayPal Account
            </button>
            <p className="text-xs text-ink-500">
              You will be redirected to PayPal to securely authenticate your account.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            ✕ {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Step 3: Confirmation

**Purpose:** Show success with order details, enrolled courses, and receipt/download CTA.

```
┌──────────────────────────────────────────────────┐
│ Checkout: Step 3 of 3 — Confirmation            │
├──────────────────────────────────────────────────┤
│                                                  │
│            🎉 Order Confirmed! 🎉                │
│                                                  │
│ Order ID: #CH-2026-0629-1234                    │
│ Transaction: 0x1a2b3c... ✓                     │
│                                                  │
│ You are now enrolled in:                        │
│ ┌────────────────────────────────────────────┐ │
│ │ [Thumb] Course Title              ENROLLED│ │
│ │         Start Learning →                  │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ Order Total: $99.99                            │
│                                                  │
│ [Download Receipt] [View My Courses]           │
│                                                  │
│                     [Browse More Courses]       │
└──────────────────────────────────────────────────┘
```

#### CheckoutConfirmationStep Component

```ts
interface CheckoutConfirmationStepProps {
  checkout: CheckoutSession;
  onContinue: () => void;
}

export function CheckoutConfirmationStep({
  checkout,
  onContinue,
}: CheckoutConfirmationStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold">Order Confirmed!</h2>

      <div className="bg-leaf-50 border border-leaf-200 rounded-lg p-6 text-left">
        <p className="text-sm text-ink-600 mb-1">Order ID</p>
        <p className="font-mono font-bold text-lg">#CH-2026-0629-{checkout.transactionHash?.slice(-4)}</p>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-ink-600 mb-1">Blockchain Transaction</p>
          <p className="font-mono text-sm break-all">
            {checkout.transactionHash}
            <span className="text-leaf-600 ml-2">✓ Verified</span>
          </p>
        </div>
      </div>

      <div className="bg-neutral-50 p-6 rounded-lg">
        <h3 className="font-bold mb-4 text-left">You are now enrolled in:</h3>
        <div className="space-y-4">
          {checkout.courses.map(item => (
            <div key={item.courseId} className="flex gap-4 items-center">
              <img
                src={item.course.thumbnailUrl || ''}
                alt={item.course.title}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1 text-left">
                <h4 className="font-semibold">{item.course.title}</h4>
                <button className="text-saffron-600 hover:text-saffron-700 text-sm font-semibold mt-1">
                  Start Learning →
                </button>
              </div>
              <span className="badge badge-success">ENROLLED</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-right mb-4">
          <p className="text-sm text-ink-600">Order Total</p>
          <p className="text-2xl font-bold text-saffron-600">
            ${checkout.total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button className="btn btn-secondary">
          ⬇ Download Receipt
        </button>
        <button onClick={onContinue} className="btn btn-primary">
          View My Courses
        </button>
      </div>

      <button className="text-saffron-600 hover:text-saffron-700 font-semibold">
        Browse More Courses
      </button>
    </div>
  );
}
```

---

## CheckoutPage Orchestration

```ts
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, checkout, updateCheckoutStep, completeCheckout } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handlePaymentSubmit = async () => {
    setLoading(true);
    setError(undefined);

    try {
      // 1. Call payment API or blockchain function
      const txHash = await processPayment(checkout);

      // 2. Create enrollments for each course
      const enrollmentIds = await enrollmentsApi.createMultiple(
        checkout.courses.map(item => ({
          courseId: item.courseId,
          txHash,
          amountPaid: checkout.total,
        }))
      );

      // 3. Update checkout state with transaction and enrollments
      completeCheckout(txHash, enrollmentIds);

      // 4. Move to confirmation
      updateCheckoutStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateStep = (step: CheckoutSession['step']) => {
    updateCheckoutStep(step);
  };

  const handleContinueShopping = () => {
    completeCheckout('', []);
    router.push('/dashboard/courses');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 px-4">
      <div className="lg:col-span-2">
        {checkout.step === 'review' && (
          <CheckoutReviewStep
            checkout={checkout}
            onNext={() => handleNavigateStep('payment')}
            onBack={() => router.push('/cart')}
            onEditCart={() => router.push('/cart')}
          />
        )}

        {checkout.step === 'payment' && (
          <CheckoutPaymentStep
            checkout={checkout}
            onNext={handlePaymentSubmit}
            onBack={() => handleNavigateStep('review')}
            isLoading={loading}
            error={error}
          />
        )}

        {checkout.step === 'confirmation' && (
          <CheckoutConfirmationStep
            checkout={checkout}
            onContinue={handleContinueShopping}
          />
        )}
      </div>

      {checkout.step !== 'confirmation' && (
        <div className="lg:col-span-1">
          <OrderSummary cart={cart} onCheckout={() => {}} />
        </div>
      )}
    </div>
  );
}

async function processPayment(checkout: CheckoutSession): Promise<string> {
  // Call Stellar blockchain or payment gateway
  // Return transaction hash
}
```

---

## Mobile Responsiveness

### Cart Page (375px)

- Single column
- Thumbnails: 60x60px
- Order summary: sticky footer or collapsible toggle
- Promo code input: full width

### Checkout Pages (375px)

- Full width, no sidebar
- Order summary: collapsible "Show Order Summary" section above buttons
- Form inputs: full width, larger touch targets (44x44px min)
- Buttons: full width stack vertically

---

## File Structure

```
src/
  app/
    dashboard/
      cart/
        page.tsx                     ← Cart page
      checkout/
        page.tsx                     ← Checkout page (multi-step)
  components/
    cart/
      CartItemsList.tsx
      CartPage.tsx
      PromoCodeSection.tsx
      EmptyCartState.tsx
      OrderSummary.tsx
    checkout/
      CheckoutReviewStep.tsx
      CheckoutPaymentStep.tsx
      CheckoutConfirmationStep.tsx
      OrderSummary.tsx (shared)
  lib/
    context/
      CartContext.tsx               ← Cart state management
    api/
      cart.ts                        ← Cart API calls (promo validation, etc)
```

---

## Key Behaviors

### Cart Persistence

- Cart items stored in Context/Redux state (not localStorage initially; can add localStorage sync later)
- Clear cart after successful checkout

### Promo Code Validation

- Call `/api/promo/validate` with code string
- Receive: `{ isValid: boolean; discountPercent: number; message: string }`
- On error: show error message, don't apply code
- On success: apply discount and recalculate total

### Checkout Flow

1. User reviews cart items
2. Selects payment method and enters details
3. System processes payment (real or mock)
4. On success: create enrollments for each course via API
5. Show confirmation page with order details
6. User can start learning or browse more courses

### Error States

- **Empty cart:** Show empty state with "Continue Shopping" button
- **Invalid promo code:** Display inline error, prevent apply
- **Payment failure:** Show error message, allow retry
- **Enrollment failure:** Log error, prompt user to contact support

---

## No New Dependencies

All functionality uses:
- React hooks: `useState`, `useContext`, `useRef`
- Next.js routing: `useRouter`
- Existing API calls: `enrollmentsApi.create`
- Tailwind utility classes
- `lucide-react` for icons

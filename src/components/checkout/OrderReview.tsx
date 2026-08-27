'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Minus, Percent, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { formatUsdc, cn } from '@/lib/utils';

interface OrderReviewProps {
  onNext: (discount: number) => void;
}

export function OrderReview({ onNext }: OrderReviewProps) {
  const { items, removeItem, getTotalPrice } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = getTotalPrice();
  // Platform fee and discount use decimal arithmetic (formatUsdc handles toFixed(2))
  const platformFee = subtotal * 0.025; // 2.5% platform fee
  const discount = promoApplied ? subtotal * 0.1 : 0; // 10% promo discount
  const total = subtotal + platformFee - discount;

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code.');
      return;
    }

    setPromoLoading(true);
    setPromoError(null);

    // Simulate promo code validation
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (code === 'LEARN10' || code === 'STUDENT') {
      setPromoApplied(true);
      setPromoError(null);
    } else {
      setPromoError('Invalid or expired promo code. Try "LEARN10" or "STUDENT".');
      setPromoApplied(false);
    }

    setPromoLoading(false);
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setPromoCode('');
    setPromoError(null);
  };

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* Main content — enrolled courses */}
      <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold text-ink-900">Review your order</h1>
        <p className="mt-1 text-sm text-ink-600">
          You&apos;re about to enrol in {items.length} course{items.length === 1 ? '' : 's'}.
        </p>

        {/* Course list */}
        <ul className="mt-6 divide-y divide-ink-100">
          {items.map((item) => (
            <li
              key={item.courseId}
              className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
                {item.course.thumbnailUrl ? (
                  <Image
                    src={item.course.thumbnailUrl}
                    alt={item.course.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-saffron-100 to-saffron-200">
                    <span className="text-2xl">📚</span>
                  </div>
                )}
              </div>

              {/* Course details */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-saffron-600">
                  {item.course.category}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-ink-900 line-clamp-2">
                  {item.course.title}
                </h3>
                <p className="mt-0.5 text-xs text-ink-500">
                  {item.course.instructor?.name || 'Hamplard Instructor'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-leaf-600 font-medium">
                    ✓ Lifetime access
                  </span>
                  <span className="text-xs text-ink-300">·</span>
                  <span className="text-xs text-leaf-600 font-medium">
                    ✓ Certificate
                  </span>
                </div>
              </div>

              {/* Price & remove */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-base font-bold text-hamplard-primary">
                  {formatUsdc(item.course.price)}
                </span>
                <button
                  onClick={() => removeItem(item.courseId)}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 transition-colors"
                  aria-label={`Remove ${item.course.title}`}
                >
                  <Minus className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Promo code */}
        <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-ink-500" />
            <span className="text-sm font-medium text-ink-700">Promo code</span>
          </div>

          {promoApplied ? (
            <div className="flex items-center justify-between rounded-lg border border-leaf-200 bg-leaf-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-leaf-600" />
                <span className="text-sm font-medium text-leaf-800">
                  {promoCode.toUpperCase()} — 10% discount applied
                </span>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-xs text-rose-600 hover:text-rose-700 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoError(null);
                }}
                placeholder="Enter promo code"
                className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-hamplard-primary focus:outline-none focus:ring-2 focus:ring-hamplard-primary/30"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleApplyPromo}
                isLoading={promoLoading}
                loadingText="Validating..."
                disabled={!promoCode.trim()}
              >
                Apply
              </Button>
            </div>
          )}
          {promoError && (
            <p className="mt-2 text-xs text-rose-600">{promoError}</p>
          )}
          <p className="mt-2 text-[11px] text-ink-400">
            Try codes: <kbd className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px]">LEARN10</kbd> or{' '}
            <kbd className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px]">STUDENT</kbd>
          </p>
        </div>

        {/* Continue button */}
        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="lg" onClick={() => onNext(discount)}>
            Continue to Payment
          </Button>
        </div>
      </section>

      {/* Sidebar — price breakdown */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-ink-900">Price breakdown</h2>

          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-ink-600">
                Subtotal ({items.length} course{items.length === 1 ? '' : 's'})
              </dt>
              <dd className="font-medium text-ink-900">{formatUsdc(subtotal)}</dd>
            </div>

            <div className="flex items-center justify-between text-sm">
              <dt className="text-ink-600">Platform fee (2.5%)</dt>
              <dd className="font-medium text-ink-900">{formatUsdc(platformFee)}</dd>
            </div>

            {promoApplied && (
              <div className="flex items-center justify-between text-sm">
                <dt className="flex items-center gap-1 text-leaf-700">
                  <Percent className="h-3.5 w-3.5" />
                  Discount (10%)
                </dt>
                <dd className="font-medium text-leaf-700">-{formatUsdc(discount)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 border-t border-ink-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink-900">Total</span>
              <span className="text-xl font-bold text-hamplard-primary">{formatUsdc(total)}</span>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">
              All prices in USDC
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

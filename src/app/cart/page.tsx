'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Loader2, AlertCircle, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { promoCodesApi } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { formatUsdc } from '@/lib/utils';
import { CheckoutErrorBoundary } from '@/components/cart/CheckoutErrorBoundary';

interface AppliedPromo {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

function CartPageContent() {
  const router = useRouter();
  const { items, removeItem, clearCart, getTotalPrice, addItem } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [savedForLater, setSavedForLater] = useState<any[]>([]);

  const subtotal = getTotalPrice();
  const itemCount = items.length;

  const discountAmount = appliedPromo
    ? appliedPromo.discountType === 'PERCENTAGE'
      ? (subtotal * appliedPromo.discountValue) / 100
      : Math.min(appliedPromo.discountValue, subtotal)
    : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    router.push('/checkout');
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Enter a promo code');
      return;
    }
    if (items.length === 0) return;

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const result = await promoCodesApi.validate(promoCode.toUpperCase(), items[0].courseId);
      setAppliedPromo(result as AppliedPromo);
      setPromoCode('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid promo code';
      setPromoError(message);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError(null);
  };

  const handleSaveForLater = (item: any) => {
    setSavedForLater((prev) => [...prev, item]);
    removeItem(item.courseId);
  };

  const handleMoveToCart = (item: any) => {
    addItem(item.course);
    setSavedForLater((prev) => prev.filter((i) => i.courseId !== item.courseId));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-2">Shopping Cart</h1>
          <p className="text-ink-600">
            {itemCount} {itemCount === 1 ? 'course' : 'courses'} in your cart
          </p>
        </div>

        {itemCount === 0 && savedForLater.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-ink-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-ink-900 mb-2">Your cart is empty</h2>
            <p className="text-ink-600 mb-6">
              Browse our courses and add them to get started
            </p>
            <Link href="/courses">
              <Button variant="primary" size="lg">
                Browse Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {itemCount > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
                  <div className="p-6 border-b border-ink-100">
                    <h2 className="text-xl font-semibold text-ink-900">Cart Items</h2>
                  </div>
                  <div className="divide-y divide-ink-100">
                    {items.map((item) => (
                      <div key={item.courseId} className="p-6 flex gap-4">
                        {item.course.thumbnailUrl ? (
                          <img
                            src={item.course.thumbnailUrl}
                            alt={item.course.title}
                            className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gradient-to-br from-saffron-100 to-saffron-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📚</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-saffron-600 font-medium uppercase mb-1">
                            {item.course.category}
                          </p>
                          <h3 className="text-base font-semibold text-ink-900 mb-1 line-clamp-2">
                            {item.course.title}
                          </h3>
                          <p className="text-sm text-ink-500 mb-2">
                            by {item.course.instructor?.name || 'Hamplard Instructor'}
                          </p>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleSaveForLater(item)}
                              className="text-sm text-hamplard-primary hover:underline font-medium flex items-center gap-1"
                            >
                              <Heart className="w-4 h-4" />
                              Save for later
                            </button>
                            <button
                              onClick={() => removeItem(item.courseId)}
                              className="text-sm text-red-600 hover:underline font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-hamplard-primary">
                            {formatUsdc(item.course.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved for later */}
              {savedForLater.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
                  <div className="p-6 border-b border-ink-100">
                    <h2 className="text-xl font-semibold text-ink-900">
                      Saved for later ({savedForLater.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-ink-100">
                    {savedForLater.map((item, idx) => (
                      <div key={idx} className="p-6 flex gap-4">
                        {item.course.thumbnailUrl ? (
                          <img
                            src={item.course.thumbnailUrl}
                            alt={item.course.title}
                            className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gradient-to-br from-ink-100 to-ink-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📚</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-saffron-600 font-medium uppercase mb-1">
                            {item.course.category}
                          </p>
                          <h3 className="text-base font-semibold text-ink-900 mb-1 line-clamp-2">
                            {item.course.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => handleMoveToCart(item)}
                              className="text-sm text-hamplard-primary hover:underline font-medium"
                            >
                              Move to cart
                            </button>
                            <button
                              onClick={() =>
                                setSavedForLater((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-sm text-red-600 hover:underline font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-ink-900">
                            {formatUsdc(item.course.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended add-ons */}
              <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-6">
                <h2 className="text-xl font-semibold text-ink-900 mb-4">Recommended add-ons</h2>
                <p className="text-sm text-ink-600 mb-4">
                  Complete your learning journey with these popular courses
                </p>
                <Link
                  href="/courses"
                  className="text-sm text-hamplard-primary hover:underline font-medium"
                >
                  Browse all courses →
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-ink-900 mb-6">Order Summary</h2>

                {!appliedPromo ? (
                  <div className="mb-6">
                    <label htmlFor="promo-code" className="text-sm font-medium text-ink-700 block mb-2">
                      Promo code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-code"
                        type="text"
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError(null);
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-hamplard-primary focus:border-transparent"
                        disabled={isValidatingPromo}
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isValidatingPromo || !promoCode.trim()}
                        className="px-4 py-2 text-sm font-medium bg-hamplard-primary text-white rounded-lg hover:bg-hamplard-mid disabled:bg-ink-200 disabled:cursor-not-allowed transition-colors"
                      >
                        {isValidatingPromo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {promoError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-6 bg-emerald-50 rounded-lg p-3 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-900">
                        Promo: <code className="font-mono">{appliedPromo.code}</code>
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        -{formatUsdc(discountAmount)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="p-1 hover:bg-emerald-100 rounded transition-colors"
                      aria-label="Remove promo code"
                    >
                      X
                    </button>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Subtotal</span>
                    <span className="font-semibold text-ink-900">{formatUsdc(subtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-700">Discount</span>
                      <span className="font-semibold text-emerald-700">-{formatUsdc(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Platform fee</span>
                    <span className="text-ink-500">Calculated at checkout</span>
                  </div>
                  <div className="pt-3 border-t border-ink-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-ink-900">Total</span>
                      <span className="text-xl font-bold text-hamplard-primary">{formatUsdc(finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  fullWidth
                  variant="primary"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || itemCount === 0}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Checkout'}
                </Button>

                <Link
                  href="/courses"
                  className="block text-center text-sm text-hamplard-primary hover:underline mt-4"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CartPage() {
  return (
    <CheckoutErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <CartPageContent />
      </Suspense>
    </CheckoutErrorBoundary>
  );
}

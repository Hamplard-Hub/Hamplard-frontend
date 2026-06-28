'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { Button } from '@/components/ui/Button';
import { formatUsdc } from '@/lib/utils';

interface ShoppingCartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ShoppingCart({ isOpen = true, onClose }: ShoppingCartProps) {
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totalPrice = getTotalPrice();
  const itemCount = items.length;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsCheckingOut(false);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-hamplard-primary" />
          <h2 className="text-lg font-semibold text-ink-900">Shopping Cart</h2>
          {itemCount > 0 && (
            <span className="bg-hamplard-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-ink-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-ink-500" />
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <ShoppingBag className="w-12 h-12 text-ink-200 mb-3" />
            <p className="text-center text-ink-600 font-medium mb-1">Your cart is empty</p>
            <p className="text-center text-sm text-ink-400 mb-4">
              Browse our courses and add them to get started
            </p>
            <Link href="/courses">
              <Button variant="primary" size="md">
                Browse Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {items.map((item) => (
              <div
                key={item.courseId}
                className="flex gap-3 p-3 bg-ink-50 rounded-lg hover:bg-ink-100 transition-colors"
              >
                {/* Thumbnail */}
                {item.course.thumbnailUrl ? (
                  <img
                    src={item.course.thumbnailUrl}
                    alt={item.course.title}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-saffron-100 to-saffron-200 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📚</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-saffron-600 font-medium uppercase">
                    {item.course.category}
                  </p>
                  <h3 className="text-sm font-semibold text-ink-900 line-clamp-2">
                    {item.course.title}
                  </h3>
                  <p className="text-xs text-ink-500 mt-1">
                    by {item.course.instructor?.name || 'Hamplard Instructor'}
                  </p>
                  <p className="text-base font-bold text-hamplard-primary mt-2">
                    {formatUsdc(item.course.price)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.courseId)}
                  className="p-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Remove ${item.course.title} from cart`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {itemCount > 0 && (
        <div className="border-t border-ink-100 bg-gray-50 p-4 space-y-3">
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Subtotal ({itemCount} course{itemCount !== 1 ? 's' : ''})</span>
              <span className="font-semibold text-ink-900">{formatUsdc(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Platform fee</span>
              <span className="text-ink-500">Calculated at checkout</span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-2 border-t border-ink-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-ink-900">Total</span>
              <span className="text-xl font-bold text-hamplard-primary">{formatUsdc(totalPrice)}</span>
            </div>

            {/* Action Buttons */}
            <Button
              fullWidth
              variant="primary"
              size="lg"
              isLoading={isCheckingOut}
              loadingText="Processing..."
              onClick={handleCheckout}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Proceed to Checkout
            </Button>

            <button
              onClick={clearCart}
              className="w-full mt-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

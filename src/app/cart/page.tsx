'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore, type CartItem } from '@/lib/hooks/use-cart-store';

/**
 * Cart page with persistence.
 * 
 * - Cart items are persisted in localStorage and survive page refreshes
 * - Saved-for-later items are also persisted and typed as CartItem (not any)
 * - Prices are minimal and should be refreshed from API in production
 */
export default function CartPage() {
  const {
    items,
    savedForLater,
    removeItem,
    removeSavedForLater,
    saveForLater,
    moveToCart,
    clear,
    isHydrated,
  } = useCartStore();

  // Calculate total price (note: should refresh from API in production)
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const savedTotal = savedForLater.reduce((sum, item) => sum + item.price, 0);

  // Don't render until hydrated to prevent SSR/client mismatch
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0 && savedForLater.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-4 text-gray-600">
            Start exploring courses and add them to your cart!
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>

        {/* Cart Items */}
        {items.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Cart Items ({items.length})
            </h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.courseId}
                  item={item}
                  onRemove={() => removeItem(item.courseId)}
                  onSaveForLater={() => saveForLater(item)}
                />
              ))}
            </div>
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between text-xl font-semibold text-gray-900">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => clear()}
                className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Clear Cart
              </button>
              <button className="mt-3 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* Saved For Later */}
        {savedForLater.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Saved For Later ({savedForLater.length})
            </h2>
            <div className="mt-4 space-y-4">
              {savedForLater.map((item) => (
                <SavedForLaterRow
                  key={item.courseId}
                  item={item}
                  onRemove={() => removeSavedForLater(item.courseId)}
                  onMoveToCart={() => moveToCart(item.courseId)}
                />
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Total saved value: ${savedTotal.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onSaveForLater: () => void;
}

function CartItemRow({ item, onRemove, onSaveForLater }: CartItemRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{item.title}</h3>
        <p className="text-lg font-semibold text-blue-600">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSaveForLater}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Save for Later
        </button>
        <button
          onClick={onRemove}
          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

interface SavedForLaterRowProps {
  item: CartItem;
  onRemove: () => void;
  onMoveToCart: () => void;
}

function SavedForLaterRow({
  item,
  onRemove,
  onMoveToCart,
}: SavedForLaterRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{item.title}</h3>
        <p className="text-lg font-semibold text-blue-600">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onMoveToCart}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add to Cart
        </button>
        <button
          onClick={onRemove}
          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

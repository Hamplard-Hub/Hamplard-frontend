/**
 * Money utilities for handling prices in cents to avoid floating-point errors.
 * All functions work with amounts in cents (integers) internally.
 */

/**
 * Convert a price in dollars to cents.
 * Example: priceInDollars(19.99) => 1999
 */
export function priceInCents(dollars: number | string): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

/**
 * Convert cents to dollars for display.
 * Example: centsToDisplay(1999) => "19.99"
 */
export function centsToDisplay(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  return `$${sign}${dollars.toFixed(2)}`;
}

/**
 * Calculate total price from a list of dollar amounts.
 * Avoids floating-point errors by working in cents.
 */
export function calculateTotal(...prices: (number | string)[]): number {
  return prices.reduce((sum, price) => sum + priceInCents(price), 0);
}

/**
 * Apply a discount (in cents) to a subtotal.
 * Clamps the discount to never exceed the subtotal.
 * Returns the discounted total in cents (never negative).
 */
export function applyDiscount(subtotalCents: number, discountCents: number): number {
  const clampedDiscount = Math.min(Math.max(0, discountCents), Math.max(0, subtotalCents));
  return Math.max(0, subtotalCents - clampedDiscount);
}

/**
 * Calculate a percentage of an amount (in cents).
 * Example: percentOf(1000, 2.5) => 25 (2.5% of 1000 cents)
 */
export function percentOf(amountCents: number, percentValue: number): number {
  return Math.round(amountCents * (percentValue / 100));
}

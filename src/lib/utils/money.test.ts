import { describe, it, expect } from 'vitest';
import {
  priceInCents,
  centsToDisplay,
  calculateTotal,
  applyDiscount,
  percentOf,
} from './money';

describe('money utilities', () => {
  describe('priceInCents', () => {
    it('converts dollars to cents', () => {
      expect(priceInCents(19.99)).toBe(1999);
      expect(priceInCents(0.99)).toBe(99);
      expect(priceInCents(100)).toBe(10000);
    });

    it('handles string input', () => {
      expect(priceInCents('19.99')).toBe(1999);
      expect(priceInCents('0.01')).toBe(1);
    });

    it('rounds floating-point errors', () => {
      // JavaScript floating point: 0.1 + 0.2 = 0.30000000000000004
      expect(priceInCents(0.1 + 0.2)).toBe(30);
    });

    it('handles zero', () => {
      expect(priceInCents(0)).toBe(0);
    });

    it('handles negative values', () => {
      expect(priceInCents(-19.99)).toBe(-1999);
    });
  });

  describe('centsToDisplay', () => {
    it('converts cents to display string', () => {
      expect(centsToDisplay(1999)).toBe('$19.99');
      expect(centsToDisplay(99)).toBe('$0.99');
      expect(centsToDisplay(10000)).toBe('$100.00');
    });

    it('handles zero', () => {
      expect(centsToDisplay(0)).toBe('$0.00');
    });

    it('handles negative values with minus sign', () => {
      expect(centsToDisplay(-1999)).toBe('$-19.99');
    });

    it('always shows two decimal places', () => {
      expect(centsToDisplay(1)).toBe('$0.01');
      expect(centsToDisplay(1000)).toBe('$10.00');
    });
  });

  describe('calculateTotal', () => {
    it('sums multiple prices without floating-point errors', () => {
      const total = calculateTotal(19.99, 29.99, 9.99);
      expect(centsToDisplay(total)).toBe('$59.97');
    });

    it('handles mixed number and string inputs', () => {
      const total = calculateTotal(19.99, '29.99', 9.99);
      expect(centsToDisplay(total)).toBe('$59.97');
    });

    it('returns zero for empty list', () => {
      expect(calculateTotal()).toBe(0);
    });

    it('handles negative values', () => {
      const total = calculateTotal(50, -10, 5);
      expect(centsToDisplay(total)).toBe('$45.00');
    });
  });

  describe('applyDiscount', () => {
    it('subtracts discount from subtotal', () => {
      const subtotal = priceInCents(100);
      const discount = priceInCents(10);
      expect(applyDiscount(subtotal, discount)).toBe(priceInCents(90));
    });

    it('clamps discount to never exceed subtotal', () => {
      const subtotal = priceInCents(50);
      const largDiscount = priceInCents(100);
      expect(applyDiscount(subtotal, largDiscount)).toBe(0);
    });

    it('never returns negative total', () => {
      const subtotal = priceInCents(25);
      const discount = priceInCents(50);
      expect(applyDiscount(subtotal, discount)).toBe(0);
    });

    it('handles zero discount', () => {
      const subtotal = priceInCents(100);
      expect(applyDiscount(subtotal, 0)).toBe(subtotal);
    });

    it('handles zero subtotal', () => {
      expect(applyDiscount(0, 10)).toBe(0);
    });
  });

  describe('percentOf', () => {
    it('calculates percentage of amount', () => {
      const amount = priceInCents(100); // 10000 cents
      const percent = percentOf(amount, 10); // 10%
      expect(percent).toBe(1000); // 10 dollars in cents
    });

    it('rounds correctly for 2.5% platform fee', () => {
      const subtotal = priceInCents(79.99);
      const fee = percentOf(subtotal, 2.5);
      expect(centsToDisplay(fee)).toBe('$2.00');
    });

    it('handles fractional percentages', () => {
      const amount = priceInCents(1000);
      const percent = percentOf(amount, 0.5); // 0.5%
      expect(percent).toBe(5000); // $50 in cents
    });

    it('handles zero', () => {
      expect(percentOf(0, 10)).toBe(0);
      expect(percentOf(1000, 0)).toBe(0);
    });
  });

  describe('integration: negative discount scenario', () => {
    it('prevents total from going negative with large promo', () => {
      const subtotal = priceInCents(50);
      const fee = percentOf(subtotal, 2.5);
      const totalBeforeDiscount = subtotal + fee;
      const largePromo = priceInCents(100);

      const finalTotal = applyDiscount(totalBeforeDiscount, largePromo);
      expect(finalTotal).toBe(0);
      expect(centsToDisplay(finalTotal)).toBe('$0.00');
    });

    it('clamps discount at subtotal + fee sum', () => {
      const subtotal = priceInCents(39.99);
      const fee = percentOf(subtotal, 2.5);
      const totalBeforeDiscount = subtotal + fee;

      const discount = priceInCents(50); // Larger than total
      const finalTotal = applyDiscount(totalBeforeDiscount, discount);

      // Should be clamped to zero, never negative
      expect(finalTotal).toBeGreaterThanOrEqual(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { priceInCents, centsToDisplay, percentOf, applyDiscount } from '@/lib/utils/money';

/**
 * Integration tests for checkout flow money calculations
 */

describe('Checkout Money Calculations', () => {
  describe('Subtotal calculation', () => {
    it('calculates subtotal from multiple courses', () => {
      const courses = [
        { price: 19.99 },
        { price: 29.99 },
        { price: 49.99 },
      ];

      const subtotal = courses.reduce((sum, course) => sum + priceInCents(course.price), 0);
      expect(centsToDisplay(subtotal)).toBe('$99.97');
    });

    it('handles many small prices without rounding errors', () => {
      const prices = Array.from({ length: 100 }, () => 0.99);
      const subtotal = prices.reduce((sum, price) => sum + priceInCents(price), 0);

      expect(subtotal).toBe(9900); // 100 * 99 cents
      expect(centsToDisplay(subtotal)).toBe('$99.00');
    });
  });

  describe('Platform fee calculation (2.5%)', () => {
    it('calculates 2.5% fee correctly', () => {
      const subtotal = priceInCents(100);
      const fee = percentOf(subtotal, 2.5);
      expect(centsToDisplay(fee)).toBe('$2.50');
    });

    it('rounds 2.5% fee for odd amounts', () => {
      const subtotal = priceInCents(79.99);
      const fee = percentOf(subtotal, 2.5);
      // 79.99 * 0.025 = 1.99975, rounds to 2.00
      expect(centsToDisplay(fee)).toBe('$2.00');
    });

    it('maintains accuracy for large orders', () => {
      const subtotal = priceInCents(999.99);
      const fee = percentOf(subtotal, 2.5);
      // 999.99 * 0.025 = 24.99975, rounds to 25.00
      expect(centsToDisplay(fee)).toBe('$25.00');
    });
  });

  describe('Total with discount', () => {
    it('calculates total: subtotal + fee - discount', () => {
      const subtotal = priceInCents(100);
      const fee = percentOf(subtotal, 2.5);
      const discount = priceInCents(5);

      const total = applyDiscount(subtotal + fee, discount);
      expect(centsToDisplay(total)).toBe('$97.50');
    });

    it('clamps discount to never exceed total', () => {
      const subtotal = priceInCents(50);
      const fee = percentOf(subtotal, 2.5);
      const totalBeforDiscount = subtotal + fee;
      const largeDiscount = priceInCents(100); // Larger than total

      const total = applyDiscount(totalBeforDiscount, largeDiscount);
      expect(total).toBe(0);
      expect(centsToDisplay(total)).toBe('$0.00');
    });

    it('never renders negative total', () => {
      const subtotal = priceInCents(25);
      const fee = percentOf(subtotal, 2.5);
      const totalBefore = subtotal + fee;
      const discount = priceInCents(50);

      const total = applyDiscount(totalBefore, discount);
      expect(total).toBeGreaterThanOrEqual(0);
      expect(parseFloat(centsToDisplay(total).replace('$', ''))).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Floating-point edge cases', () => {
    it('handles 0.1 + 0.2 without errors (classic JS floating point issue)', () => {
      // In JavaScript: 0.1 + 0.2 = 0.30000000000000004
      const result = priceInCents(0.1 + 0.2);
      expect(result).toBe(30); // Should be exactly 30 cents
    });

    it('maintains precision across calculation chain', () => {
      const price1 = 19.99;
      const price2 = 29.99;
      const price3 = 49.99;

      // Direct sum has floating point error:
      // 19.99 + 29.99 + 49.99 = 99.96999999999999
      const directSum = price1 + price2 + price3;
      expect(directSum).not.toBe(99.97);

      // Using cents maintains precision:
      const centsSum = priceInCents(price1) + priceInCents(price2) + priceInCents(price3);
      expect(centsSum).toBe(9997);
      expect(centsToDisplay(centsSum)).toBe('$99.97');
    });

    it('rounds consistently across all operations', () => {
      const prices = [9.99, 14.99, 24.99, 49.99];
      const subtotal = prices.reduce((sum, p) => sum + priceInCents(p), 0);
      const fee = percentOf(subtotal, 2.5);
      const total = subtotal + fee;

      // All operations should use integer cents
      expect(Number.isInteger(subtotal)).toBe(true);
      expect(Number.isInteger(fee)).toBe(true);
      expect(Number.isInteger(total)).toBe(true);

      // Display should be consistent
      const display = centsToDisplay(total);
      expect(display).toMatch(/\$\d+\.\d{2}$/);
    });
  });

  describe('Promo code scenarios', () => {
    it('applies promo discount correctly', () => {
      const subtotal = priceInCents(199.99);
      const fee = percentOf(subtotal, 2.5);
      const totalBefore = subtotal + fee;
      const promoDiscount = priceInCents(20); // $20 off

      const total = applyDiscount(totalBefore, promoDiscount);
      expect(centsToDisplay(total)).toBe('$189.49');
    });

    it('caps promo at subtotal + fee', () => {
      const subtotal = priceInCents(50);
      const fee = percentOf(subtotal, 2.5);
      const totalBefore = subtotal + fee;

      const totalWithMaxPromo = applyDiscount(totalBefore, totalBefore + 1000);
      expect(totalWithMaxPromo).toBe(0);
    });

    it('handles 100% discount (free course)', () => {
      const subtotal = priceInCents(0); // Free course
      const fee = percentOf(subtotal, 2.5); // Should be 0
      const total = subtotal + fee;

      expect(total).toBe(0);
      expect(centsToDisplay(total)).toBe('$0.00');
    });
  });

  describe('Real-world scenarios', () => {
    it('typical checkout: 3 courses, 2.5% fee, $10 promo', () => {
      const courses = [
        priceInCents(19.99),
        priceInCents(29.99),
        priceInCents(49.99),
      ];
      const subtotal = courses.reduce((a, b) => a + b, 0);
      const fee = percentOf(subtotal, 2.5);
      const promo = priceInCents(10);

      const total = applyDiscount(subtotal + fee, promo);

      expect(centsToDisplay(subtotal)).toBe('$99.97');
      expect(centsToDisplay(fee)).toBe('$2.50');
      expect(centsToDisplay(total)).toBe('$92.47');
    });

    it('single expensive course', () => {
      const subtotal = priceInCents(299.99);
      const fee = percentOf(subtotal, 2.5);
      const total = subtotal + fee;

      expect(centsToDisplay(total)).toBe('$307.49');
    });

    it('bundle with aggressive discount', () => {
      const subtotal = priceInCents(99.99);
      const fee = percentOf(subtotal, 2.5);
      const totalBefore = subtotal + fee;
      const promo = priceInCents(50); // 50% off (clamped to total)

      const total = applyDiscount(totalBefore, promo);

      expect(centsToDisplay(total)).toBe('$52.49');
    });
  });
});

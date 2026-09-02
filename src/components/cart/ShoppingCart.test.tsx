import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ShoppingCart } from './ShoppingCart';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { promoCodesApi } from '@/lib/api/services';
import type { Course } from '@/types';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/api/services', () => ({
  promoCodesApi: {
    validate: vi.fn(),
  },
}));

// Mock course data
const mockCourse1: Course = {
  id: 'course-1',
  instructorAddress: 'instructor-1',
  title: 'Advanced Tailoring Techniques',
  description: 'Learn professional tailoring',
  category: 'Tailoring',
  level: 'Advanced',
  language: 'English',
  thumbnailUrl: 'https://example.com/course1.jpg',
  previewVideoUrl: null,
  price: 49.99,
  platformFeePercent: 10,
  status: 'ACTIVE',
  totalLessons: 25,
  totalDuration: 7200,
  totalEnrollments: 150,
  totalRevenue: 7498.5,
  txHash: null,
  approvedAt: '2024-01-01T00:00:00Z',
  createdAt: '2023-12-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  instructor: {
    name: 'Jane Doe',
    stellarAddress: 'instructor-1',
    avatarUrl: null,
  },
  modules: [],
  _count: { enrollments: 150 },
  rating: 4.8,
  reviewCount: 45,
};

const mockCourse2: Course = {
  ...mockCourse1,
  id: 'course-2',
  title: 'Professional Photography',
  category: 'Photography',
  price: 79.99,
  instructor: {
    name: 'John Smith',
    stellarAddress: 'instructor-2',
    avatarUrl: null,
  },
};

const mockCourse3: Course = {
  ...mockCourse1,
  id: 'course-3',
  title: 'Baking Fundamentals',
  category: 'Baking',
  price: 29.99,
  instructor: {
    name: 'Sarah Baker',
    stellarAddress: 'instructor-3',
    avatarUrl: null,
  },
};

describe('ShoppingCart Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear cart before each test
    useCartStore.getState().clearCart();
    // Clear all mocks
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Empty Cart State', () => {
    it('displays empty cart message when no items', () => {
      render(<ShoppingCart />);
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText(/Browse our courses and add them to get started/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /browse courses/i })).toBeInTheDocument();
    });

    it('shows cart count as 0 in header when empty', () => {
      render(<ShoppingCart />);
      
      const header = screen.getByText('Shopping Cart');
      expect(header).toBeInTheDocument();
      // No badge should be shown when cart is empty
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('does not show checkout button when cart is empty', () => {
      render(<ShoppingCart />);
      
      expect(screen.queryByRole('button', { name: /proceed to checkout/i })).not.toBeInTheDocument();
    });
  });

  describe('Adding Items to Cart', () => {
    it('displays course when added to cart', () => {
      const { rerender } = render(<ShoppingCart />);
      
      // Add item to cart
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Advanced Tailoring Techniques')).toBeInTheDocument();
      expect(screen.getByText('by Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('TAILORING')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('updates cart count badge when item is added', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Badge should show count
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows multiple courses in cart', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      useCartStore.getState().addItem(mockCourse2);
      useCartStore.getState().addItem(mockCourse3);
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Advanced Tailoring Techniques')).toBeInTheDocument();
      expect(screen.getByText('Professional Photography')).toBeInTheDocument();
      expect(screen.getByText('Baking Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Count badge
    });

    it('displays course thumbnail or fallback icon', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const thumbnail = screen.getByAltText('Advanced Tailoring Techniques course thumbnail');
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', 'https://example.com/course1.jpg');
    });
  });

  describe('Removing Items from Cart', () => {
    it('removes course when remove button is clicked', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      useCartStore.getState().addItem(mockCourse2);
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Advanced Tailoring Techniques')).toBeInTheDocument();
      expect(screen.getByText('Professional Photography')).toBeInTheDocument();
      
      // Find and click remove button for first course
      const removeButtons = screen.getAllByRole('button', { name: /remove.*from cart/i });
      await user.click(removeButtons[0]);
      
      rerender(<ShoppingCart />);
      
      // First course should be removed
      expect(screen.queryByText('Advanced Tailoring Techniques')).not.toBeInTheDocument();
      expect(screen.getByText('Professional Photography')).toBeInTheDocument();
    });

    it('updates cart count when item is removed', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      useCartStore.getState().addItem(mockCourse2);
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByRole('button', { name: /remove.*from cart/i });
      await user.click(removeButtons[0]);
      
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('updates total price when item is removed', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1); // $49.99
      useCartStore.getState().addItem(mockCourse2); // $79.99
      rerender(<ShoppingCart />);
      
      // Total should be $129.98
      expect(screen.getByText('$129.98')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByRole('button', { name: /remove.*from cart/i });
      await user.click(removeButtons[1]); // Remove course 2
      
      rerender(<ShoppingCart />);
      
      // Total should now be $49.99
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('shows empty cart when last item is removed', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const removeButton = screen.getByRole('button', { name: /remove.*from cart/i });
      await user.click(removeButton);
      
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  describe('Promo Code Functionality', () => {
    it('shows promo code input when cart has items', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      expect(screen.getByLabelText(/have a promo code/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    it('applies valid percentage-based promo code', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1); // $49.99
      rerender(<ShoppingCart />);
      
      // Mock valid promo code response
      vi.mocked(promoCodesApi.validate).mockResolvedValue({
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      });
      
      const promoInput = screen.getByPlaceholderText(/enter code/i);
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(promoInput, 'SAVE20');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/promo applied/i)).toBeInTheDocument();
      });
      
      // Check discount is shown (20% of $49.99 = $10.00)
      expect(screen.getByText(/saving \$10\.00/i)).toBeInTheDocument();
      
      // Final price should be $39.99
      expect(screen.getByText('$39.99')).toBeInTheDocument();
    });

    it('applies valid fixed-amount promo code', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1); // $49.99
      useCartStore.getState().addItem(mockCourse2); // $79.99
      rerender(<ShoppingCart />);
      
      // Mock valid fixed discount promo code
      vi.mocked(promoCodesApi.validate).mockResolvedValue({
        code: 'FIXED15',
        discountType: 'FIXED',
        discountValue: 15,
      });
      
      const promoInput = screen.getByPlaceholderText(/enter code/i);
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(promoInput, 'FIXED15');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/promo applied/i)).toBeInTheDocument();
      });
      
      // Check discount is shown
      expect(screen.getByText(/saving \$15\.00/i)).toBeInTheDocument();
      
      // Final price should be $114.98 (129.98 - 15)
      expect(screen.getByText('$114.98')).toBeInTheDocument();
    });

    it('shows error message for invalid promo code', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Mock invalid promo code response
      vi.mocked(promoCodesApi.validate).mockRejectedValue(
        new Error('Invalid promo code')
      );
      
      const promoInput = screen.getByPlaceholderText(/enter code/i);
      const applyButton = screen.getByRole('button', { name: /apply/i });
      
      await user.type(promoInput, 'INVALID');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid promo code/i)).toBeInTheDocument();
      });
      
      // Original price should still be shown
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('shows error when applying empty promo code', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      expect(screen.getByText(/enter a promo code/i)).toBeInTheDocument();
    });

    it('allows removing applied promo code', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Apply promo code
      vi.mocked(promoCodesApi.validate).mockResolvedValue({
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      });
      
      const promoInput = screen.getByPlaceholderText(/enter code/i);
      await user.type(promoInput, 'SAVE20');
      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/promo applied/i)).toBeInTheDocument();
      });
      
      // Remove promo code
      const removePromoButton = screen.getByRole('button', { name: /remove promo code/i });
      await user.click(removePromoButton);
      
      rerender(<ShoppingCart />);
      
      // Promo should be gone and original price restored
      expect(screen.queryByText(/promo applied/i)).not.toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('converts promo code to uppercase', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const promoInput = screen.getByPlaceholderText(/enter code/i) as HTMLInputElement;
      await user.type(promoInput, 'save20');
      
      // Input should show uppercase
      expect(promoInput.value).toBe('SAVE20');
    });

    it('clears error when user types new code', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Trigger error
      vi.mocked(promoCodesApi.validate).mockRejectedValue(
        new Error('Invalid promo code')
      );
      
      const promoInput = screen.getByPlaceholderText(/enter code/i);
      await user.type(promoInput, 'INVALID');
      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid promo code/i)).toBeInTheDocument();
      });
      
      // Type new code
      await user.clear(promoInput);
      await user.type(promoInput, 'NEW');
      
      // Error should be cleared
      expect(screen.queryByText(/invalid promo code/i)).not.toBeInTheDocument();
    });
  });

  describe('Total Price Calculation', () => {
    it('displays correct subtotal for single course', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Subtotal (1 course)')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('displays correct subtotal for multiple courses', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1); // $49.99
      useCartStore.getState().addItem(mockCourse2); // $79.99
      useCartStore.getState().addItem(mockCourse3); // $29.99
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Subtotal (3 courses)')).toBeInTheDocument();
      expect(screen.getByText('$159.97')).toBeInTheDocument();
    });

    it('shows discount line when promo is applied', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Apply promo
      vi.mocked(promoCodesApi.validate).mockResolvedValue({
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      });
      
      await user.type(screen.getByPlaceholderText(/enter code/i), 'SAVE20');
      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Discount')).toBeInTheDocument();
      });
      
      expect(screen.getByText('-$10.00')).toBeInTheDocument();
    });

    it('does not allow negative total price', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse3); // $29.99
      rerender(<ShoppingCart />);
      
      // Apply discount larger than price
      vi.mocked(promoCodesApi.validate).mockResolvedValue({
        code: 'HUGE50',
        discountType: 'FIXED',
        discountValue: 50,
      });
      
      await user.type(screen.getByPlaceholderText(/enter code/i), 'HUGE50');
      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/promo applied/i)).toBeInTheDocument();
      });
      
      // Total should be $0, not negative
      const totalPrices = screen.getAllByText('$0.00');
      expect(totalPrices.length).toBeGreaterThan(0);
    });
  });

  describe('Checkout Navigation', () => {
    it('navigates to checkout when "Proceed to Checkout" is clicked', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const checkoutLink = screen.getByRole('link', { name: /proceed to checkout/i });
      expect(checkoutLink).toHaveAttribute('href', '/checkout');
    });

    it('shows checkout button only when cart has items', () => {
      const { rerender } = render(<ShoppingCart />);
      
      // Empty cart
      expect(screen.queryByRole('link', { name: /proceed to checkout/i })).not.toBeInTheDocument();
      
      // Add item
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      expect(screen.getByRole('link', { name: /proceed to checkout/i })).toBeInTheDocument();
    });
  });

  describe('Clear Cart Functionality', () => {
    it('clears all items when "Clear Cart" is clicked', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      useCartStore.getState().addItem(mockCourse2);
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
      
      const clearButton = screen.getByRole('button', { name: /clear cart/i });
      await user.click(clearButton);
      
      rerender(<ShoppingCart />);
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('removes applied promo code when cart is cleared', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Apply promo
      vi.mocked(promoCodesApi.validate).mockResolvedValue({
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      });
      
      await user.type(screen.getByPlaceholderText(/enter code/i), 'SAVE20');
      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/promo applied/i)).toBeInTheDocument();
      });
      
      // Clear cart
      await user.click(screen.getByRole('button', { name: /clear cart/i }));
      
      rerender(<ShoppingCart />);
      
      // Add new item
      useCartStore.getState().addItem(mockCourse2);
      rerender(<ShoppingCart />);
      
      // Promo should not be applied to new cart
      expect(screen.queryByText(/promo applied/i)).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<ShoppingCart onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close cart/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not show close button when onClose is not provided', () => {
      render(<ShoppingCart />);
      
      expect(screen.queryByRole('button', { name: /close cart/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for remove buttons', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const removeButton = screen.getByRole('button', { 
        name: /remove advanced tailoring techniques from cart/i 
      });
      expect(removeButton).toBeInTheDocument();
    });

    it('cart count badge is visible and readable', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      useCartStore.getState().addItem(mockCourse2);
      rerender(<ShoppingCart />);
      
      const badge = screen.getByText('2');
      expect(badge).toBeVisible();
      expect(badge.closest('span')).toHaveClass('bg-hamplard-primary');
    });

    it('promo code input has proper label', () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      const promoInput = screen.getByLabelText(/have a promo code/i);
      expect(promoInput).toBeInTheDocument();
      expect(promoInput).toHaveAttribute('id', 'promo-code');
    });
  });

  describe('Edge Cases', () => {
    it('handles courses without thumbnails', () => {
      const courseWithoutThumbnail: Course = {
        ...mockCourse1,
        thumbnailUrl: null,
      };
      
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(courseWithoutThumbnail);
      rerender(<ShoppingCart />);
      
      // Should show fallback icon
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('handles courses without instructor name', () => {
      const courseWithoutInstructor: Course = {
        ...mockCourse1,
        instructor: {
          name: null,
          stellarAddress: 'instructor-x',
          avatarUrl: null,
        },
      };
      
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(courseWithoutInstructor);
      rerender(<ShoppingCart />);
      
      // Should show fallback name
      expect(screen.getByText('by Hamplard Instructor')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      const { rerender } = render(<ShoppingCart />);
      
      useCartStore.getState().addItem(mockCourse1);
      rerender(<ShoppingCart />);
      
      // Simulate API error
      vi.mocked(promoCodesApi.validate).mockRejectedValue(
        new Error('Network error')
      );
      
      await user.type(screen.getByPlaceholderText(/enter code/i), 'TEST');
      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });
});

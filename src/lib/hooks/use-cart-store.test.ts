import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from './use-cart-store';
import type { Course } from '@/types';

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
  totalLessons: 30,
};

const mockCourse3: Course = {
  ...mockCourse1,
  id: 'course-3',
  title: 'Baking Fundamentals',
  category: 'Baking',
  price: 29.99,
  totalLessons: 15,
};

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  describe('Initial State', () => {
    it('starts with empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.items).toEqual([]);
      expect(result.current.getItemCount()).toBe(0);
      expect(result.current.getTotalPrice()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('adds a course to cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].courseId).toBe('course-1');
      expect(result.current.items[0].course.title).toBe('Advanced Tailoring Techniques');
      expect(result.current.items[0].addedAt).toBeDefined();
    });

    it('adds multiple courses to cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
        result.current.addItem(mockCourse2);
        result.current.addItem(mockCourse3);
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.items.map(item => item.courseId)).toEqual([
        'course-1',
        'course-2',
        'course-3',
      ]);
    });

    it('does not add duplicate courses', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
        result.current.addItem(mockCourse1); // Try to add same course again
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].courseId).toBe('course-1');
    });

    it('includes timestamp when adding course', () => {
      const { result } = renderHook(() => useCartStore());
      const beforeAdd = Date.now();

      act(() => {
        result.current.addItem(mockCourse1);
      });

      const afterAdd = Date.now();
      const addedAt = new Date(result.current.items[0].addedAt).getTime();

      expect(addedAt).toBeGreaterThanOrEqual(beforeAdd);
      expect(addedAt).toBeLessThanOrEqual(afterAdd);
    });
  });

  describe('removeItem', () => {
    it('removes a course from cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
        result.current.addItem(mockCourse2);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeItem('course-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].courseId).toBe('course-2');
    });

    it('handles removing non-existent course gracefully', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
      });

      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.removeItem('non-existent-id');
      });

      // Cart should be unchanged
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].courseId).toBe('course-1');
    });

    it('removes correct course when multiple courses present', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
        result.current.addItem(mockCourse2);
        result.current.addItem(mockCourse3);
      });

      act(() => {
        result.current.removeItem('course-2');
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items.map(item => item.courseId)).toEqual([
        'course-1',
        'course-3',
      ]);
    });
  });

  describe('clearCart', () => {
    it('removes all items from cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
        result.current.addItem(mockCourse2);
        result.current.addItem(mockCourse3);
      });

      expect(result.current.items).toHaveLength(3);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.getItemCount()).toBe(0);
      expect(result.current.getTotalPrice()).toBe(0);
    });

    it('handles clearing empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.items).toEqual([]);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('getTotalPrice', () => {
    it('returns 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.getTotalPrice()).toBe(0);
    });

    it('calculates total price for single course', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
      });

      expect(result.current.getTotalPrice()).toBe(49.99);
    });

    it('calculates total price for multiple courses', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1); // 49.99
        result.current.addItem(mockCourse2); // 79.99
        result.current.addItem(mockCourse3); // 29.99
      });

      expect(result.current.getTotalPrice()).toBe(159.97);
    });

    it('updates total when course is removed', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1); // 49.99
        result.current.addItem(mockCourse2); // 79.99
      });

      expect(result.current.getTotalPrice()).toBe(129.98);

      act(() => {
        result.current.removeItem('course-2');
      });

      expect(result.current.getTotalPrice()).toBe(49.99);
    });
  });

  describe('getItemCount', () => {
    it('returns 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.getItemCount()).toBe(0);
    });

    it('returns correct count for cart with items', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
      });

      expect(result.current.getItemCount()).toBe(1);

      act(() => {
        result.current.addItem(mockCourse2);
        result.current.addItem(mockCourse3);
      });

      expect(result.current.getItemCount()).toBe(3);
    });

    it('updates count when items are removed', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.addItem(mockCourse1);
        result.current.addItem(mockCourse2);
        result.current.addItem(mockCourse3);
      });

      expect(result.current.getItemCount()).toBe(3);

      act(() => {
        result.current.removeItem('course-2');
      });

      expect(result.current.getItemCount()).toBe(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.getItemCount()).toBe(0);
    });
  });

  describe('State Persistence Across Hook Instances', () => {
    it('shares state between multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useCartStore());
      const { result: result2 } = renderHook(() => useCartStore());

      act(() => {
        result1.current.addItem(mockCourse1);
      });

      // Both instances should see the same state
      expect(result1.current.items).toHaveLength(1);
      expect(result2.current.items).toHaveLength(1);
      expect(result2.current.items[0].courseId).toBe('course-1');
    });

    it('updates all instances when state changes', () => {
      const { result: result1 } = renderHook(() => useCartStore());
      const { result: result2 } = renderHook(() => useCartStore());

      act(() => {
        result1.current.addItem(mockCourse1);
        result1.current.addItem(mockCourse2);
      });

      expect(result2.current.getItemCount()).toBe(2);

      act(() => {
        result2.current.removeItem('course-1');
      });

      expect(result1.current.getItemCount()).toBe(1);
      expect(result1.current.items[0].courseId).toBe('course-2');
    });
  });

  describe('Edge Cases', () => {
    it('handles courses with price of 0', () => {
      const { result } = renderHook(() => useCartStore());
      const freeCourse: Course = { ...mockCourse1, id: 'free-course', price: 0 };

      act(() => {
        result.current.addItem(freeCourse);
        result.current.addItem(mockCourse1);
      });

      expect(result.current.getTotalPrice()).toBe(49.99);
    });

    it('handles very large cart (performance)', () => {
      const { result } = renderHook(() => useCartStore());
      const courses: Course[] = Array.from({ length: 50 }, (_, i) => ({
        ...mockCourse1,
        id: `course-${i}`,
        price: 10,
      }));

      act(() => {
        courses.forEach(course => result.current.addItem(course));
      });

      expect(result.current.getItemCount()).toBe(50);
      expect(result.current.getTotalPrice()).toBe(500);
    });

    it('handles decimal prices correctly', () => {
      const { result } = renderHook(() => useCartStore());
      const course1: Course = { ...mockCourse1, id: 'c1', price: 19.99 };
      const course2: Course = { ...mockCourse1, id: 'c2', price: 29.95 };
      const course3: Course = { ...mockCourse1, id: 'c3', price: 9.99 };

      act(() => {
        result.current.addItem(course1);
        result.current.addItem(course2);
        result.current.addItem(course3);
      });

      expect(result.current.getTotalPrice()).toBe(59.93);
    });
  });
});

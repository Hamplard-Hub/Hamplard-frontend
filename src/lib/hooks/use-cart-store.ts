import { create } from 'zustand';
import type { Course } from '@/types';

export interface CartItem {
  courseId: string;
  course: Course;
  addedAt: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (course: Course) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (course: Course) => {
    set((state) => {
      const exists = state.items.find((item) => item.courseId === course.id);
      if (exists) return state;

      return {
        items: [
          ...state.items,
          {
            courseId: course.id,
            course,
            addedAt: new Date().toISOString(),
          },
        ],
      };
    });
  },

  removeItem: (courseId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.courseId !== courseId),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.course.price, 0);
  },

  getItemCount: () => {
    return get().items.length;
  },
}));

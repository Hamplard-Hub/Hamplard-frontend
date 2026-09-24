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
  /** Adds every course not already in the cart; returns how many were added. */
  addItems: (courses: Course[]) => number;
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

  addItems: (courses: Course[]) => {
    const inCart = new Set(get().items.map((item) => item.courseId));
    const addedAt = new Date().toISOString();
    const added: CartItem[] = [];

    courses.forEach((course) => {
      if (inCart.has(course.id)) return;
      inCart.add(course.id);
      added.push({ courseId: course.id, course, addedAt });
    });

    if (added.length > 0) {
      set((state) => ({ items: [...state.items, ...added] }));
    }
    return added.length;
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

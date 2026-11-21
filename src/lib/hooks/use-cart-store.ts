'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Course } from '@/types';

/**
 * Minimal cart item containing only essential data.
 * Prices are NOT persisted to avoid stale pricing on reload.
 * Full course data is refetched from API on mount.
 */
export interface CartItem {
  courseId: string;
  title: string;
  price: number;
  thumbnail?: string;
}

interface CartStore {
  // Cart items
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  clear: () => void;

  // Saved for later
  savedForLater: CartItem[];
  saveForLater: (item: CartItem) => void;
  moveToCart: (courseId: string) => void;
  removeSavedForLater: (courseId: string) => void;

  // Hydration tracking - prevents SSR/client mismatch
  isHydrated: boolean;
}

/**
 * Cart store with persistence.
 * 
 * - Items and savedForLater survive page refreshes
 * - Minimal data persisted (courseId, title, price, thumbnail only)
 * - Prices should be refreshed from API on app load to avoid stale charges
 * - Hydration flag prevents SSR mismatch (e.g., cart badge flashing before hydration)
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      // Cart items
      items: [],
      addItem: (item) =>
        set((state) => {
          // Avoid duplicates
          if (state.items.find((i) => i.courseId === item.courseId)) {
            return state;
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (courseId) =>
        set((state) => ({
          items: state.items.filter((i) => i.courseId !== courseId),
        })),
      clear: () => set({ items: [] }),

      // Saved for later
      savedForLater: [],
      saveForLater: (item) =>
        set((state) => {
          // Move from items to savedForLater if in cart
          const updatedItems = state.items.filter(
            (i) => i.courseId !== item.courseId
          );
          // Avoid duplicates in savedForLater
          if (
            state.savedForLater.find((i) => i.courseId === item.courseId)
          ) {
            return { items: updatedItems };
          }
          return {
            items: updatedItems,
            savedForLater: [...state.savedForLater, item],
          };
        }),
      moveToCart: (courseId) =>
        set((state) => {
          const item = state.savedForLater.find((i) => i.courseId === courseId);
          if (!item) return state;
          return {
            savedForLater: state.savedForLater.filter(
              (i) => i.courseId !== courseId
            ),
            items: [...state.items, item],
          };
        }),
      removeSavedForLater: (courseId) =>
        set((state) => ({
          savedForLater: state.savedForLater.filter(
            (i) => i.courseId !== courseId
          ),
        })),

      isHydrated: false,
    }),
    {
      name: 'hamplard-cart',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    }
  )
);

/**
 * Get cart item count, only after hydration to avoid SSR mismatch.
 * Use this for badge counts that must match on server.
 */
export const useCartCount = () => {
  const { items, isHydrated } = useCartStore();
  return isHydrated ? items.length : 0;
};

/**
 * Get saved for later count, only after hydration.
 */
export const useSavedForLaterCount = () => {
  const { savedForLater, isHydrated } = useCartStore();
  return isHydrated ? savedForLater.length : 0;
};

'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'hamplard_wishlist';

interface WishlistStore {
  courseIds: string[];
  toggle:       (courseId: string) => void;
  add:          (courseId: string) => void;
  remove:       (courseId: string) => void;
  isWishlisted: (courseId: string) => boolean;
  clear:        () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      courseIds: [],

      toggle: (courseId) => {
        set((state) => ({
          courseIds: state.courseIds.includes(courseId)
            ? state.courseIds.filter((id) => id !== courseId)
            : [...state.courseIds, courseId],
        }));
      },

      add: (courseId) => {
        set((state) => (
          state.courseIds.includes(courseId)
            ? state
            : { courseIds: [...state.courseIds, courseId] }
        ));
      },

      remove: (courseId) => {
        set((state) => ({
          courseIds: state.courseIds.filter((id) => id !== courseId),
        }));
      },

      isWishlisted: (courseId) => get().courseIds.includes(courseId),

      clear: () => set({ courseIds: [] }),
    }),
    {
      name: STORAGE_KEY,
      // createJSONStorage swallows the ReferenceError on the server, so persistence
      // simply stays inert until the store reaches the browser.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ courseIds: state.courseIds }),
    },
  ),
);

/**
 * True once the persisted wishlist has been read back from localStorage.
 *
 * Server-rendered markup can never know what is in localStorage, so anything
 * driven by the wishlist must render its empty state first and fill in after
 * hydration — otherwise React discards the mismatched client render.
 */
export function useWishlistHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useWishlistStore.persist.onFinishHydration(() => setHydrated(true));
    // Hydration is synchronous for localStorage, so it has usually already
    // finished by the time this effect runs and the subscription above missed it.
    if (useWishlistStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  return hydrated;
}

/** Hydration-safe read of a single course's wishlist state. */
export function useIsWishlisted(courseId: string): boolean {
  const hydrated = useWishlistHydrated();
  const wishlisted = useWishlistStore((state) => state.courseIds.includes(courseId));
  return hydrated && wishlisted;
}

/** Hydration-safe wishlist size, for badges and counters. */
export function useWishlistCount(): number {
  const hydrated = useWishlistHydrated();
  const count = useWishlistStore((state) => state.courseIds.length);
  return hydrated ? count : 0;
}

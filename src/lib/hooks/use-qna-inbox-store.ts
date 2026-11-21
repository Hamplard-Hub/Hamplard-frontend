'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'hamplard_qna_inbox';

/**
 * Tracks the instructor's Q&A inbox state.
 *
 * `seenQuestionIds` holds every question the instructor has opened, so the
 * sidebar badge can show how many questions are still unread after a reload.
 * `unreadQuestionIds` is the mirrored, currently-unread list that the badge
 * renders; it is recomputed whenever the inbox loads new questions.
 */
interface QnaInboxStore {
  seenQuestionIds: string[];
  unreadQuestionIds: string[];
  /** Number of questions still waiting for an instructor answer. */
  unansweredCount: number;
  setUnread: (questionIds: string[]) => void;
  markSeen: (questionId: string) => void;
  setUnansweredCount: (count: number) => void;
  reset: () => void;
}

export const useQnaInboxStore = create<QnaInboxStore>()(
  persist(
    (set, get) => ({
      seenQuestionIds: [],
      unreadQuestionIds: [],
      unansweredCount: 0,

      setUnread: (questionIds) => {
        const { seenQuestionIds } = get();
        const seen = new Set(seenQuestionIds);
        const unread = questionIds.filter((id) => !seen.has(id));
        set({ unreadQuestionIds: unread });
      },

      markSeen: (questionId) => {
        const { seenQuestionIds, unreadQuestionIds } = get();
        if (seenQuestionIds.includes(questionId)) return;

        set({
          seenQuestionIds: [...seenQuestionIds, questionId],
          unreadQuestionIds: unreadQuestionIds.filter((id) => id !== questionId),
        });
      },

      setUnansweredCount: (count) => set({ unansweredCount: count }),

      reset: () =>
        set({ seenQuestionIds: [], unreadQuestionIds: [], unansweredCount: 0 }),
    }),
    {
      name: STORAGE_KEY,
      // createJSONStorage swallows the ReferenceError on the server, so
      // persistence stays inert until the store reaches the browser.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        seenQuestionIds: state.seenQuestionIds,
        unreadQuestionIds: state.unreadQuestionIds,
        unansweredCount: state.unansweredCount,
      }),
    },
  ),
);

/**
 * True once the persisted inbox state has been read back from localStorage.
 *
 * Server-rendered markup can never know what is in localStorage, so badges
 * must render their empty state first and fill in after hydration.
 */
export function useQnaInboxHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useQnaInboxStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    // Hydration is synchronous for localStorage, so it has usually already
    // finished by the time this effect runs and the subscription missed it.
    if (useQnaInboxStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  return hydrated;
}

/** Hydration-safe unread question count, for the dashboard sidebar badge. */
export function useQnaUnreadCount(): number {
  const hydrated = useQnaInboxHydrated();
  const count = useQnaInboxStore((state) => state.unreadQuestionIds.length);
  return hydrated ? count : 0;
}

import { beforeEach, describe, expect, it } from 'vitest';
import {
  RECENTLY_VIEWED_KEY,
  RECENTLY_VIEWED_LIMIT,
  RECENTLY_VIEWED_MAX_AGE_MS,
  getRecentlyViewed,
  recordRecentlyViewed,
} from '@/lib/recently-viewed';

describe('recently viewed courses', () => {
  beforeEach(() => localStorage.clear());

  it('stores courses in LIFO order, de-duplicates them, and caps the list at eight', () => {
    for (let index = 0; index < RECENTLY_VIEWED_LIMIT + 2; index += 1) {
      recordRecentlyViewed(`course-${index}`, index);
    }
    recordRecentlyViewed('course-5', 100);

    const entries = getRecentlyViewed(100);
    expect(entries).toHaveLength(RECENTLY_VIEWED_LIMIT);
    expect(entries[0].courseId).toBe('course-5');
    expect(new Set(entries.map(({ courseId }) => courseId)).size).toBe(entries.length);
    expect(entries.some(({ courseId }) => courseId === 'course-0')).toBe(false);
  });

  it('purges entries older than thirty days', () => {
    const now = Date.now();
    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify([
        { courseId: 'fresh', viewedAt: new Date(now).toISOString() },
        { courseId: 'expired', viewedAt: new Date(now - RECENTLY_VIEWED_MAX_AGE_MS - 1).toISOString() },
      ]),
    );

    expect(getRecentlyViewed(now).map(({ courseId }) => courseId)).toEqual(['fresh']);
    expect(JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? '[]')).toHaveLength(1);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OFFLINE_CACHE_NAME,
  OFFLINE_INDEX_KEY,
  downloadLesson,
  formatBytes,
  getStorageUsage,
  isLessonDownloaded,
  listOfflineLessons,
  removeOfflineLesson,
  toAbsoluteUrl,
} from './cache';

/** Minimal in-memory stand-in for the Cache Storage API. */
class FakeCache {
  store = new Map<string, Response>();

  async put(request: RequestInfo | URL, response: Response) {
    this.store.set(String(request), response);
  }

  async match(request: RequestInfo | URL) {
    return this.store.get(String(request));
  }

  async delete(request: RequestInfo | URL) {
    return this.store.delete(String(request));
  }
}

let cache: FakeCache;

const installCaches = () => {
  cache = new FakeCache();
  const mock = {
    open: vi.fn(async () => cache),
    delete: vi.fn(async () => true),
  };
  Object.defineProperty(window, 'caches', {
    value: mock,
    configurable: true,
    writable: true,
  });
  return mock;
};

describe('offline cache', () => {
  beforeEach(() => {
    window.localStorage.clear();
    installCaches();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('payload', {
            status: 200,
            headers: { 'content-length': '7' },
          }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('formatBytes', () => {
    it('returns "0 B" for empty or invalid sizes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-5)).toBe('0 B');
      expect(formatBytes(Number.NaN)).toBe('0 B');
    });

    it('formats bytes, kilobytes and megabytes', () => {
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 12)).toBe('12 MB');
      expect(formatBytes(1024 * 1024 * 12.5)).toBe('12.5 MB');
    });
  });

  describe('toAbsoluteUrl', () => {
    it('resolves relative paths against the current origin', () => {
      expect(toAbsoluteUrl('/media/lesson.mp4')).toBe(
        `${window.location.origin}/media/lesson.mp4`,
      );
    });

    it('leaves absolute urls untouched', () => {
      const url = 'https://cdn.example.com/video.mp4';
      expect(toAbsoluteUrl(url)).toBe(url);
    });
  });

  describe('downloadLesson', () => {
    const input = {
      lessonId: 'lesson-1',
      courseId: 'course-1',
      courseTitle: 'Tailoring Basics',
      lessonTitle: 'Measuring the body',
      urls: ['/media/lesson-1.mp4', '/media/lesson-1.pdf'],
    };

    it('caches every resource and records the lesson in the index', async () => {
      const { lesson, failed } = await downloadLesson(input);

      expect(failed).toEqual([]);
      expect(lesson.status).toBe('complete');
      expect(lesson.bytes).toBe(14);
      expect(lesson.resources).toHaveLength(2);
      expect(cache.store.size).toBe(2);

      const stored = listOfflineLessons();
      expect(stored).toHaveLength(1);
      expect(stored[0].lessonId).toBe('lesson-1');
      expect(stored[0].courseTitle).toBe('Tailoring Basics');
      expect(isLessonDownloaded('lesson-1')).toBe(true);
    });

    it('marks the download partial when a resource cannot be fetched', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          if (url.endsWith('.pdf')) throw new Error('network down');
          return new Response('payload', {
            status: 200,
            headers: { 'content-length': '7' },
          });
        }),
      );

      const { lesson, failed } = await downloadLesson(input);

      expect(lesson.status).toBe('partial');
      expect(failed).toHaveLength(1);
      expect(failed[0]).toContain('.pdf');
      expect(lesson.resources).toHaveLength(1);
    });

    it('replaces a previous entry for the same lesson', async () => {
      await downloadLesson(input);
      await downloadLesson({ ...input, lessonTitle: 'Measuring the body (v2)' });

      const stored = listOfflineLessons();
      expect(stored).toHaveLength(1);
      expect(stored[0].lessonTitle).toBe('Measuring the body (v2)');
    });
  });

  describe('removeOfflineLesson', () => {
    it('drops the index entry and the cached responses', async () => {
      await downloadLesson({
        lessonId: 'lesson-1',
        courseId: 'course-1',
        courseTitle: 'Tailoring Basics',
        lessonTitle: 'Measuring the body',
        urls: ['/media/lesson-1.mp4'],
      });

      await removeOfflineLesson('lesson-1');

      expect(listOfflineLessons()).toEqual([]);
      expect(isLessonDownloaded('lesson-1')).toBe(false);
      expect(cache.store.size).toBe(0);
    });

    it('is a no-op for an unknown lesson', async () => {
      await expect(removeOfflineLesson('missing')).resolves.toBeUndefined();
    });
  });

  describe('getStorageUsage', () => {
    it('reports the usage and quota from the Storage API', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: { estimate: async () => ({ usage: 50, quota: 200 }) },
        configurable: true,
      });

      await expect(getStorageUsage()).resolves.toEqual({
        usage: 50,
        quota: 200,
        ratio: 0.25,
      });
    });

    it('falls back to zeroes when the Storage API is unavailable', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        configurable: true,
      });

      await expect(getStorageUsage()).resolves.toEqual({
        usage: 0,
        quota: 0,
        ratio: 0,
      });
    });
  });

  it('keeps the index under a stable localStorage key', () => {
    expect(OFFLINE_INDEX_KEY).toBe('hamplard:offline-lessons');
    expect(OFFLINE_CACHE_NAME).toBe('hamplard-media-v1');
  });
});

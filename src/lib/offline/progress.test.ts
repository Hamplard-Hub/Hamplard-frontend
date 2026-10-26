import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PENDING_PROGRESS_KEY,
  clearPendingProgress,
  flushPendingProgress,
  getPendingProgress,
  pendingProgressCount,
  queueProgressUpdate,
} from './progress';

vi.mock('@/lib/api/services', () => ({
  lessonsApi: {
    markComplete: vi.fn(async () => ({ success: true })),
    updateProgress: vi.fn(async () => undefined),
  },
}));

describe('offline progress queue', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('queues an update and reports the pending count', () => {
    queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 30 });

    expect(pendingProgressCount()).toBe(1);
    expect(getPendingProgress()[0]).toMatchObject({
      lessonId: 'lesson-1',
      enrollmentId: 'enr-1',
      watchedSecs: 30,
    });
    expect(getPendingProgress()[0].queuedAt).toBeTruthy();
  });

  it('replaces an earlier update for the same lesson', () => {
    queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 30 });
    queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 90 });

    const pending = getPendingProgress();
    expect(pending).toHaveLength(1);
    expect(pending[0].watchedSecs).toBe(90);
  });

  it('keeps updates for different lessons', () => {
    queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 30 });
    queueProgressUpdate({ lessonId: 'lesson-2', enrollmentId: 'enr-1', watchedSecs: 45 });

    expect(pendingProgressCount()).toBe(2);
  });

  describe('flushPendingProgress', () => {
    it('sends every queued update and empties the queue', async () => {
      const send = vi.fn(async () => undefined);
      queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 30 });
      queueProgressUpdate({ lessonId: 'lesson-2', enrollmentId: 'enr-1', completed: true });

      const sent = await flushPendingProgress(send);

      expect(sent).toBe(2);
      expect(send).toHaveBeenCalledTimes(2);
      expect(pendingProgressCount()).toBe(0);
    });

    it('keeps an update that failed to send', async () => {
      const send = vi.fn(async (entry: { lessonId: string }) => {
        if (entry.lessonId === 'lesson-1') throw new Error('offline');
      });
      queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 30 });
      queueProgressUpdate({ lessonId: 'lesson-2', enrollmentId: 'enr-1', watchedSecs: 60 });

      const sent = await flushPendingProgress(send);

      expect(sent).toBe(1);
      expect(pendingProgressCount()).toBe(1);
      expect(getPendingProgress()[0].lessonId).toBe('lesson-1');
    });

    it('does nothing when the queue is empty', async () => {
      const send = vi.fn(async () => undefined);
      await expect(flushPendingProgress(send)).resolves.toBe(0);
      expect(send).not.toHaveBeenCalled();
    });
  });

  it('clears the queue on request', () => {
    queueProgressUpdate({ lessonId: 'lesson-1', enrollmentId: 'enr-1', watchedSecs: 30 });
    clearPendingProgress();
    expect(pendingProgressCount()).toBe(0);
    expect(window.localStorage.getItem(PENDING_PROGRESS_KEY)).toBe('[]');
  });
});

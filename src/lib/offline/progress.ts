import { lessonsApi } from '@/lib/api/services';
import type { PendingProgress } from './types';

/** localStorage key holding the queued lesson-completion updates. */
export const PENDING_PROGRESS_KEY = 'hamplard:pending-progress';

const isBrowser = typeof window !== 'undefined';

/** Sends one queued update to the API. Throwing means "keep it queued". */
export type ProgressSender = (entry: PendingProgress) => Promise<void>;

function readQueue(): PendingProgress[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(PENDING_PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingProgress[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: PendingProgress[]): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable — the update is simply not queued.
  }
}

/**
 * Queues a lesson-progress update for later delivery.
 *
 * Called when the device is offline so the learner's completion is not lost.
 */
export function queueProgressUpdate(
  entry: Omit<PendingProgress, 'queuedAt'>,
): PendingProgress {
  const queued: PendingProgress = { ...entry, queuedAt: new Date().toISOString() };
  const queue = readQueue();

  // A later update for the same lesson supersedes an earlier one — there is no
  // point sending "watched 30s" and then "watched 90s" for the same lesson.
  const deduped = queue.filter(
    (item) =>
      !(item.lessonId === queued.lessonId && item.enrollmentId === queued.enrollmentId),
  );
  deduped.push(queued);
  writeQueue(deduped);

  return queued;
}

/** Updates still waiting to be delivered. */
export function getPendingProgress(): PendingProgress[] {
  return readQueue();
}

/** How many updates are waiting to be delivered. */
export function pendingProgressCount(): number {
  return readQueue().length;
}

/** The default sender — talks to the lessons API. */
export const defaultProgressSender: ProgressSender = async (entry) => {
  if (entry.completed) {
    await lessonsApi.markComplete(entry.lessonId, entry.enrollmentId, entry.watchedSecs);
    return;
  }
  if (typeof entry.watchedSecs === 'number') {
    await lessonsApi.updateProgress(entry.lessonId, entry.enrollmentId, entry.watchedSecs);
  }
};

/**
 * Delivers every queued update.
 *
 * Returns the number of updates that were sent successfully. A failing update
 * stops the flush and stays queued so ordering is preserved — the API treats a
 * completion as "final", so an older watch-progress ping must not land after
 * it.
 */
export async function flushPendingProgress(
  send: ProgressSender = defaultProgressSender,
): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining: PendingProgress[] = [];
  let sent = 0;

  for (const entry of queue) {
    try {
      await send(entry);
      sent += 1;
    } catch {
      remaining.push(entry);
    }
  }

  writeQueue(remaining);
  return sent;
}

/** Drops every queued update without sending it. */
export function clearPendingProgress(): void {
  writeQueue([]);
}

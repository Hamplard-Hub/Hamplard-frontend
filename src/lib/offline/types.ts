/**
 * Types shared by the offline-download helpers.
 *
 * The download pipeline is split in two:
 *  - `cache.ts`  — owns Cache Storage (the media itself) and the local index.
 *  - `progress.ts` — owns the queue of lesson-completion updates that could
 *    not be sent while the device was offline.
 */

/** A lesson that has been cached for offline playback. */
export interface OfflineLesson {
  /** Lesson id — the key used to look the entry up. */
  lessonId: string;
  /** Course the lesson belongs to. */
  courseId: string;
  /** Course title, denormalised so the list renders without extra fetches. */
  courseTitle: string;
  /** Lesson title, denormalised for the same reason. */
  lessonTitle: string;
  /** Absolute URLs that were written into the cache. */
  resources: string[];
  /** Approximate size of the cached responses in bytes. */
  bytes: number;
  /** ISO timestamp of the download. */
  downloadedAt: string;
  /** `complete` when every resource was cached, `partial` otherwise. */
  status: OfflineDownloadStatus;
}

export type OfflineDownloadStatus = 'complete' | 'partial';

/** Input for {@link downloadLesson}. */
export interface DownloadLessonInput {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  /**
   * URLs to cache — the video (and its alternate qualities), the lesson
   * resource sheet and any material files. Relative URLs are resolved against
   * the page origin before caching.
   */
  urls: string[];
}

/** Result of a single download attempt. */
export interface DownloadLessonResult {
  lesson: OfflineLesson;
  /** Resources that could not be fetched (network error, 404, …). */
  failed: string[];
}

/** Storage figures reported by the Storage API. */
export interface OfflineStorageUsage {
  /** Bytes currently used by the origin. */
  usage: number;
  /** Total bytes the origin may use. */
  quota: number;
  /** `usage / quota`, clamped to 0–1. */
  ratio: number;
}

/** A lesson-completion update waiting to be sent to the API. */
export interface PendingProgress {
  lessonId: string;
  enrollmentId: string;
  /** Seconds watched, when the update was a watch-progress ping. */
  watchedSecs?: number;
  /** Whether the lesson was marked complete. */
  completed?: boolean;
  /** ISO timestamp of when the update was queued. */
  queuedAt: string;
}

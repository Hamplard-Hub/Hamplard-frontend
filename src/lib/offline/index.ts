/**
 * Offline lesson downloads (PWA).
 *
 * Public entry point for the offline feature — re-exports the cache, progress
 * and service-worker helpers so callers only import from one place.
 */
export {
  OFFLINE_CACHE_NAME,
  OFFLINE_INDEX_KEY,
  clearOfflineLessons,
  downloadLesson,
  formatBytes,
  getStorageUsage,
  isLessonDownloaded,
  isOfflineSupported,
  listOfflineLessons,
  removeOfflineLesson,
  toAbsoluteUrl,
} from './cache';

export {
  PENDING_PROGRESS_KEY,
  clearPendingProgress,
  defaultProgressSender,
  flushPendingProgress,
  getPendingProgress,
  pendingProgressCount,
  queueProgressUpdate,
  type ProgressSender,
} from './progress';

export {
  SERVICE_WORKER_URL,
  SYNC_TAG,
  isServiceWorkerSupported,
  listenForServiceWorkerMessages,
  registerOfflineServiceWorker,
  requestBackgroundSync,
} from './register';

export type {
  DownloadLessonInput,
  DownloadLessonResult,
  OfflineDownloadStatus,
  OfflineLesson,
  OfflineStorageUsage,
  PendingProgress,
} from './types';

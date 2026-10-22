import type {
  DownloadLessonInput,
  DownloadLessonResult,
  OfflineLesson,
  OfflineStorageUsage,
} from './types';

/**
 * Cache Storage bucket holding the downloaded lesson media.
 *
 * IMPORTANT: the name must stay in sync with `MEDIA_CACHE` in `public/sw.js`
 * — the service worker reads from this same bucket when replaying a cached
 * response while the device is offline.
 */
export const OFFLINE_CACHE_NAME = 'hamplard-media-v1';

/** localStorage key holding the index of downloaded lessons. */
export const OFFLINE_INDEX_KEY = 'hamplard:offline-lessons';

const isBrowser = typeof window !== 'undefined';

/** True when the browser exposes the Cache Storage API. */
export function isOfflineSupported(): boolean {
  return isBrowser && typeof window.caches !== 'undefined';
}

function readIndex(): OfflineLesson[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineLesson[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: OfflineLesson[]): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be full or blocked (private mode) — the cache still works,
    // it just cannot be listed.
  }
}

/** Resolves a possibly relative URL against the current origin. */
export function toAbsoluteUrl(url: string): string {
  if (!isBrowser) return url;
  try {
    return new URL(url, window.location.href).toString();
  } catch {
    return url;
  }
}

/** All downloaded lessons, newest first. */
export function listOfflineLessons(): OfflineLesson[] {
  return readIndex().sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
  );
}

/** Whether a lesson is already cached for offline use. */
export function isLessonDownloaded(lessonId: string): boolean {
  return readIndex().some((entry) => entry.lessonId === lessonId);
}

/** Approximate byte size of a response, best effort. */
async function byteSizeOf(response: Response): Promise<number> {
  const header = response.headers.get('content-length');
  if (header) {
    const parsed = Number(header);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  // Opaque responses (cross-origin `no-cors`) expose neither headers nor body.
  if (response.type === 'opaque') return 0;
  try {
    const buffer = await response.clone().arrayBuffer();
    return buffer.byteLength;
  } catch {
    return 0;
  }
}

/**
 * Fetches a URL and stores it in the cache.
 *
 * Cross-origin media that rejects the default (cors) mode is retried as an
 * opaque response — the browser can still cache and replay those, it just
 * cannot read their body.
 */
async function cacheUrl(cache: Cache, url: string): Promise<number> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    response = await fetch(url, { mode: 'no-cors' });
  }

  if (!response.ok && response.type !== 'opaque') {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const bytes = await byteSizeOf(response);
  await cache.put(url, response.clone());
  return bytes;
}

/**
 * Downloads a lesson's media into Cache Storage.
 *
 * Resources are fetched one at a time so a single missing file does not
 * abort the whole download — failures are reported back in `failed` and the
 * entry is marked `partial`.
 */
export async function downloadLesson(
  input: DownloadLessonInput,
): Promise<DownloadLessonResult> {
  if (!isOfflineSupported()) {
    throw new Error('Offline downloads are not supported in this browser.');
  }

  const cache = await window.caches.open(OFFLINE_CACHE_NAME);
  const resources: string[] = [];
  const failed: string[] = [];
  let bytes = 0;

  for (const rawUrl of input.urls) {
    if (!rawUrl) continue;
    const url = toAbsoluteUrl(rawUrl);
    try {
      bytes += await cacheUrl(cache, url);
      resources.push(url);
    } catch {
      failed.push(url);
    }
  }

  const lesson: OfflineLesson = {
    lessonId: input.lessonId,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    lessonTitle: input.lessonTitle,
    resources,
    bytes,
    downloadedAt: new Date().toISOString(),
    status: failed.length === 0 ? 'complete' : 'partial',
  };

  const index = readIndex().filter((entry) => entry.lessonId !== lesson.lessonId);
  index.push(lesson);
  writeIndex(index);

  return { lesson, failed };
}

/** Removes a lesson's cached media and its index entry. */
export async function removeOfflineLesson(lessonId: string): Promise<void> {
  const entry = readIndex().find((item) => item.lessonId === lessonId);
  writeIndex(readIndex().filter((item) => item.lessonId !== lessonId));

  if (!entry || !isOfflineSupported()) return;
  const cache = await window.caches.open(OFFLINE_CACHE_NAME);
  await Promise.all(
    entry.resources.map((url) => cache.delete(url).catch(() => false)),
  );
}

/** Removes every downloaded lesson. */
export async function clearOfflineLessons(): Promise<void> {
  writeIndex([]);
  if (!isOfflineSupported()) return;
  await window.caches.delete(OFFLINE_CACHE_NAME).catch(() => false);
}

/** Storage figures for the origin, used by the downloads page. */
export async function getStorageUsage(): Promise<OfflineStorageUsage> {
  if (!isBrowser || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, ratio: 0 };
  }
  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      ratio: quota > 0 ? Math.min(1, Math.max(0, usage / quota)) : 0,
    };
  } catch {
    return { usage: 0, quota: 0, ratio: 0 };
  }
}

/** Formats a byte count for display (e.g. `12.4 MB`). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  if (exponent === 0) return `${Math.round(value)} ${units[exponent]}`;
  if (value >= 10) return `${Math.round(value)} ${units[exponent]}`;
  // Keep up to one decimal, strip a trailing .0
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${units[exponent]}`;
}

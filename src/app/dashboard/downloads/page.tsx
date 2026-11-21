'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, Trash2, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';

interface DownloadedLesson {
  lessonId: string;
  title: string;
  courseTitle: string;
  videoUrl: string;
  resourceUrl?: string;
  downloadedAt: string;
}

const DOWNLOADS_KEY = 'hamplard-downloads';

function getStoredDownloads(): DownloadedLesson[] {
  try {
    return JSON.parse(localStorage.getItem(DOWNLOADS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveDownloads(items: DownloadedLesson[]) {
  try {
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
  } catch {}
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadedLesson[]>([]);
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [storageQuota, setStorageQuota] = useState<number | null>(null);
  const [online, setOnline] = useState(true);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    setDownloads(getStoredDownloads());
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setSwReady(true);
          // Request storage estimate via the SW
          navigator.serviceWorker.controller?.postMessage({ type: 'GET_STORAGE_ESTIMATE' });
          return reg;
        })
        .catch(() => {});

      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'STORAGE_ESTIMATE') {
          setStorageUsed(e.data.usage ?? null);
          setStorageQuota(e.data.quota ?? null);
        }
        if (e.data?.type === 'DOWNLOAD_COMPLETE') {
          setDownloads((prev) => {
            const updated = prev.map((d) =>
              d.lessonId === e.data.lessonId ? { ...d } : d,
            );
            saveDownloads(updated);
            return updated;
          });
        }
        if (e.data?.type === 'DELETE_COMPLETE') {
          setDownloads((prev) => {
            const updated = prev.filter((d) => d.lessonId !== e.data.lessonId);
            saveDownloads(updated);
            return updated;
          });
        }
      });
    } else {
      // Fallback: use Storage API directly if available
      if ('storage' in navigator && navigator.storage.estimate) {
        navigator.storage.estimate().then(({ usage, quota }) => {
          setStorageUsed(usage ?? null);
          setStorageQuota(quota ?? null);
        });
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDelete = useCallback((lesson: DownloadedLesson) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DELETE_LESSON',
        lessonId: lesson.lessonId,
        videoUrl: lesson.videoUrl,
        resourceUrl: lesson.resourceUrl,
      });
    } else {
      setDownloads((prev) => {
        const updated = prev.filter((d) => d.lessonId !== lesson.lessonId);
        saveDownloads(updated);
        return updated;
      });
    }
  }, []);

  const storagePercent =
    storageUsed != null && storageQuota
      ? Math.min(100, Math.round((storageUsed / storageQuota) * 100))
      : null;
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  HardDriveDownload,
  Loader2,
  Trash2,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui';
import {
  clearOfflineLessons,
  flushPendingProgress,
  formatBytes,
  getStorageUsage,
  listOfflineLessons,
  pendingProgressCount,
  removeOfflineLesson,
  type OfflineLesson,
  type OfflineStorageUsage,
} from '@/lib/offline';

/**
 * Downloads — the offline library.
 *
 * Lists every lesson cached in Cache Storage, shows how much space the app is
 * using and lets the learner free it up again. Progress updates that were
 * queued while offline can be flushed manually from here too.
 */
export default function DownloadsPage() {
  const [lessons, setLessons] = useState<OfflineLesson[]>([]);
  const [usage, setUsage] = useState<OfflineStorageUsage>({ usage: 0, quota: 0, ratio: 0 });
  const [loading, setLoading] = useState(true);
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLessons(listOfflineLessons());
    setUsage(await getStorageUsage());
    setPending(pendingProgressCount());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    };

    setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void load();

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  const handleDelete = useCallback(
    async (lessonId: string) => {
      setBusyLessonId(lessonId);
      try {
        await removeOfflineLesson(lessonId);
        await refresh();
      } finally {
        setBusyLessonId(null);
      }
    },
    [refresh],
  );

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      await clearOfflineLessons();
      await refresh();
      setMessage('All downloads removed.');
    } finally {
      setClearing(false);
    }
  }, [refresh]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const sent = await flushPendingProgress();
      await refresh();
      setMessage(
        sent > 0
          ? `Synced ${sent} progress update${sent !== 1 ? 's' : ''}.`
          : 'Nothing to sync — all progress is up to date.',
      );
    } catch {
      setMessage('Could not sync progress. Check your connection and try again.');
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const downloadedBytes = lessons.reduce((total, lesson) => total + lesson.bytes, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card h-28" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Downloads' },
          ]}
          className="mb-3"
        />
        <h1 className="section-heading">Downloaded Lessons</h1>
        <p className="mt-1 text-sm text-ink-500">
          Lessons saved for offline viewing.
        </p>
      </div>

      {/* Connection status */}
      <div
        className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
          online
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}
      >
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        {online ? 'Online — progress syncing normally' : 'Offline — progress will sync when you reconnect'}
      </div>

      {/* Storage usage */}
      {storageUsed != null && (
        <div className="card mb-6 p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-ink-500" />
            <span className="text-sm font-medium text-ink-700">Storage</span>
          </div>
          <p className="text-xs text-ink-500 mb-2">
            {formatBytes(storageUsed)} used
            {storageQuota ? ` of ${formatBytes(storageQuota)}` : ''}
          </p>
          {storagePercent != null && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-hamplard-primary transition-all"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {!swReady && 'serviceWorker' in navigator === false && (
        <div className="card mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your browser does not support offline downloads.
        </div>
      )}

      {downloads.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <Download className="h-10 w-10 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No downloads yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Open any lesson and tap the download icon to save it for offline
            viewing.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {downloads.map((lesson) => (
            <li
              key={lesson.lessonId}
              className="card flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {lesson.title}
                </p>
                <p className="truncate text-xs text-ink-500">
                  {lesson.courseTitle}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  Downloaded{' '}
                  {new Date(lesson.downloadedAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(lesson)}
                aria-label={`Remove ${lesson.title} from downloads`}
                className="flex-shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <h1 className="section-heading">Offline Downloads</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          Lessons saved on this device for watching without a connection.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      {!isOnline && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>
            You are offline. Downloaded lessons still play — progress will sync when you
            reconnect.
          </span>
        </div>
      )}

      {/* Storage usage */}
      <section className="card p-5 mb-5" aria-label="Storage usage">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="h-5 w-5 text-saffron-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink-900">Storage usage</h2>
          </div>
          <span className="text-xs font-medium text-ink-500">
            {usage.quota > 0
              ? `${formatBytes(usage.usage)} of ${formatBytes(usage.quota)} used`
              : `${formatBytes(usage.usage)} used`}
          </span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
          role="progressbar"
          aria-label="Storage used"
          aria-valuenow={Math.round(usage.ratio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-saffron-500 transition-all duration-300"
            style={{ width: `${Math.max(2, Math.round(usage.ratio * 100))}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-ink-400">
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} downloaded ·{' '}
          {formatBytes(downloadedBytes)} of lesson media
        </p>
      </section>

      {/* Queued progress */}
      {pending > 0 && (
        <section className="card p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <RefreshCw className="h-4 w-4 text-saffron-600" aria-hidden="true" />
            <span>
              {pending} progress update{pending !== 1 ? 's' : ''} waiting to sync
            </span>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="btn-primary inline-flex items-center gap-2 text-xs disabled:opacity-60"
          >
            {syncing && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Sync now
          </button>
        </section>
      )}

      {/* Downloads */}
      {lessons.length === 0 ? (
        <div className="card p-12 text-center">
          <Download className="w-12 h-12 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No lessons downloaded yet</p>
          <p className="text-xs text-ink-400 mt-1">
            Open a lesson and choose “Download for offline” to watch it without a connection.
          </p>
          <Link href="/dashboard/my-courses" className="btn-primary mt-4 inline-flex">
            Go to my courses
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {lessons.map((lesson) => (
              <li key={lesson.lessonId} className="card p-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center flex-shrink-0">
                  <Download className="h-5 w-5 text-white" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-semibold text-ink-900 leading-tight truncate">
                    {lesson.lessonTitle}
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5 truncate">{lesson.courseTitle}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                    <span>{formatBytes(lesson.bytes)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(lesson.downloadedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {lesson.status === 'partial' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Some files could not be downloaded
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/dashboard/courses/${lesson.courseId}/learn?lesson=${lesson.lessonId}`}
                    className="btn-ghost text-xs"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(lesson.lessonId)}
                    disabled={busyLessonId === lesson.lessonId}
                    aria-label={`Delete ${lesson.lessonTitle} download`}
                    title="Delete download"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                  >
                    {busyLessonId === lesson.lessonId ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
          >
            {clearing && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete all downloads
          </button>
        </>
      )}
    </div>
  );
}

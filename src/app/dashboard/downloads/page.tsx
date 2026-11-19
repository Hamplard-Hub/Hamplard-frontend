'use client';

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
        <h1 className="section-heading">Offline Downloads</h1>
        <p className="mt-1 text-sm text-ink-500">
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
            You are offline. Downloaded lessons still play.
          </span>
        </div>
      )}

      {lessons.length === 0 ? (
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
          {lessons.map((lesson) => (
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
                onClick={() => handleDelete(lesson.lessonId)}
                disabled={busyLessonId === lesson.lessonId}
                aria-label={`Remove ${lesson.title} from downloads`}
                className="flex-shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                {busyLessonId === lesson.lessonId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

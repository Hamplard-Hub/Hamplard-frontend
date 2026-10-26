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
      )}
    </div>
  );
}

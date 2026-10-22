'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import { downloadLesson, isOfflineSupported, listOfflineLessons } from '@/lib/offline';
import type { Lesson } from '@/types';

/**
 * Collects every media URL that belongs to a lesson.
 *
 * All quality levels are included because the player switches between them
 * automatically — caching only the default source would break playback once
 * the browser picks a different rendition while offline.
 */
export function collectLessonUrls(lesson: Lesson): string[] {
  const urls = new Set<string>();

  if (lesson.videoUrl) urls.add(lesson.videoUrl);
  if (lesson.videoQualities) {
    Object.values(lesson.videoQualities).forEach((url) => {
      if (url) urls.add(url);
    });
  }
  if (lesson.resourceUrl) urls.add(lesson.resourceUrl);

  return Array.from(urls);
}

/**
 * useOfflineDownloads
 *
 * Tracks which lessons are cached for offline playback and exposes a
 * `download` action for the "Download for offline" button.
 */
export function useOfflineDownloads() {
  const toast = useToast();
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(() => new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Starts as `false` so the server and the first client render agree; the
  // real value is resolved in the effect below.
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!isOfflineSupported()) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setDownloadedIds(new Set(listOfflineLessons().map((lesson) => lesson.lessonId)));
  }, []);

  const isDownloaded = useCallback(
    (lessonId: string) => downloadedIds.has(lessonId),
    [downloadedIds],
  );

  const download = useCallback(
    async (lesson: Lesson, course: { id: string; title: string }) => {
      if (!isOfflineSupported()) {
        toast.error({
          title: 'Offline downloads unavailable',
          description: 'This browser does not support offline storage.',
        });
        return;
      }

      const urls = collectLessonUrls(lesson);
      if (urls.length === 0) {
        toast.warning({
          title: 'Nothing to download',
          description: 'This lesson has no video or downloadable resources attached.',
        });
        return;
      }

      setDownloadingId(lesson.id);
      try {
        const { lesson: saved, failed } = await downloadLesson({
          lessonId: lesson.id,
          courseId: course.id,
          courseTitle: course.title,
          lessonTitle: lesson.title,
          urls,
        });

        setDownloadedIds((previous) => new Set(previous).add(saved.lessonId));

        if (failed.length === 0) {
          toast.success({
            title: 'Downloaded for offline',
            description: `“${lesson.title}” is now available without a connection.`,
          });
        } else {
          toast.warning({
            title: 'Partially downloaded',
            description: `${failed.length} file${failed.length !== 1 ? 's' : ''} could not be saved. Try again on a stable connection.`,
          });
        }
      } catch {
        toast.error({
          title: 'Download failed',
          description: 'The lesson files could not be saved. Please try again.',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [toast],
  );

  return { supported, downloadedIds, downloadingId, isDownloaded, download };
}

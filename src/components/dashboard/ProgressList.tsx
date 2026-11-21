'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Share2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Enrollment, Lesson } from '@/types';
import { SocialShare } from '@/components/ui/SocialShare';

type ProgressFilter = 'all' | 'in-progress' | 'completed' | 'not-started';
type ProgressSort = 'recent' | 'completion' | 'enrollment';

interface ProgressItem {
  enrollment: Enrollment;
  percent: number;
  completed: number;
  total: number;
  lastActivity: string | null;
  nextLesson: Lesson | undefined;
}

const getLessons = (enrollment: Enrollment) =>
  enrollment.course?.modules?.flatMap((module) => module.lessons) ?? [];

function getProgressItem(enrollment: Enrollment): ProgressItem {
  const lessons = getLessons(enrollment);
  const completedIds = new Set(
    enrollment.lessonProgress?.filter((progress) => progress.completed).map((progress) => progress.lessonId),
  );
  const completed = lessons.length > 0
    ? lessons.filter((lesson) => completedIds.has(lesson.id)).length
    : enrollment.lessonProgress?.filter((progress) => progress.completed).length ?? 0;
  const total = lessons.length || enrollment.course?.totalLessons || enrollment.lessonProgress?.length || 0;
  const percent = enrollment.status === 'COMPLETED'
    ? 100
    : Math.min(100, Math.max(0, Math.round(enrollment.progressPercent ?? (total > 0 ? (completed / total) * 100 : 0))));
  const activities = enrollment.lessonProgress
    ?.map((progress) => progress.completedAt)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) ?? [];

  return {
    enrollment,
    percent,
    completed,
    total,
    lastActivity: activities[0] ?? (percent > 0 ? enrollment.enrolledAt : null),
    nextLesson: lessons.find((lesson) => !completedIds.has(lesson.id)) ?? lessons[0],
  };
}

function formatHours(enrollments: Enrollment[]) {
  const seconds = enrollments.reduce(
    (total, enrollment) => total + (enrollment.lessonProgress ?? []).reduce(
      (lessonTotal, progress) => lessonTotal + (progress.watchedSecs || 0),
      0,
    ),
    0,
  );
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default function ProgressList({ enrollments }: { enrollments: Enrollment[] }) {
  const [filter, setFilter] = useState<ProgressFilter>('all');
  const [sort, setSort] = useState<ProgressSort>('recent');
  const [shareItem, setShareItem] = useState<ProgressItem | null>(null);
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => enrollments.map(getProgressItem), [enrollments]);
  const visibleItems = useMemo(() => {
    const filtered = items.filter(({ percent }) => {
      if (filter === 'in-progress') return percent > 0 && percent < 100;
      if (filter === 'completed') return percent >= 100;
      if (filter === 'not-started') return percent === 0;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'completion') return b.percent - a.percent;
      if (sort === 'enrollment') {
        return new Date(b.enrollment.enrolledAt).getTime() - new Date(a.enrollment.enrolledAt).getTime();
      }
      return new Date(b.lastActivity ?? b.enrollment.enrolledAt).getTime()
        - new Date(a.lastActivity ?? a.enrollment.enrolledAt).getTime();
    });
  }, [filter, items, sort]);

  const getShareUrl = (item: ProgressItem) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/courses/${item.enrollment.courseId}`;
  };

  const getOgImageUrl = (item: ProgressItem) => {
    const params = new URLSearchParams({
      title: item.enrollment.course.title,
      percent: String(item.percent),
      category: item.enrollment.course.category,
      completed: String(item.completed),
      total: String(item.total),
    });
    return `/api/og/progress?${params.toString()}`;
  };

  const handleCopyLink = async (item: ProgressItem) => {
    const url = getShareUrl(item);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div>
      <div className="card p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">Total hours learned</p>
          <p className="font-display text-2xl font-semibold text-ink-900">{formatHours(enrollments)}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="sr-only" htmlFor="progress-filter">Filter courses</label>
          <select id="progress-filter" value={filter} onChange={(event) => setFilter(event.target.value as ProgressFilter)} className="input text-sm py-2">
            <option value="all">All courses</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not-started">Not Started</option>
          </select>
          <label className="sr-only" htmlFor="progress-sort">Sort courses</label>
          <select id="progress-sort" value={sort} onChange={(event) => setSort(event.target.value as ProgressSort)} className="input text-sm py-2">
            <option value="recent">Most Recent Activity</option>
            <option value="completion">Completion Percentage</option>
            <option value="enrollment">Enrollment Date</option>
          </select>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No courses match this filter</p>
          <p className="text-xs text-ink-400 mt-1">Try another progress category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const { enrollment, percent, completed, total, lastActivity, nextLesson } = item;
            const href = nextLesson
              ? `/dashboard/courses/${enrollment.courseId}/learn?lesson=${encodeURIComponent(nextLesson.id)}`
              : `/dashboard/courses/${enrollment.courseId}/learn`;
            const isComplete = percent >= 100;
            return (
              <Link key={enrollment.id} href={href} className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-4 hover:shadow-lifted transition-shadow group relative">
                <div className="w-full sm:w-40 aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-saffron-100 to-saffron-200 flex-shrink-0">
                  {enrollment.course.thumbnailUrl ? (
                    <img src={enrollment.course.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-saffron-700"><BookOpen className="w-8 h-8" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-saffron-600 font-medium">{enrollment.course.category}</p>
                      <h2 className="text-sm font-semibold text-ink-900 mt-0.5">{enrollment.course.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Share Progress Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShareItem(item);
                        }}
                        aria-label={`Share progress for ${enrollment.course.title}`}
                        title="Share your learning milestone"
                        className="p-1.5 rounded-lg text-ink-400 hover:text-saffron-600 hover:bg-saffron-50 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <span className={isComplete ? 'text-leaf-600' : 'text-saffron-700'}>{isComplete ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}</span>
                    </div>
                  </div>
                  <div className="mt-4" role="progressbar" aria-label={`${enrollment.course.title} progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-medium text-ink-700">{percent}% complete</span><span className="text-ink-400">{completed} of {total} lectures</span></div>
                    <div className="progress-bar"><div className={isComplete ? 'progress-fill bg-leaf-500' : 'progress-fill'} style={{ width: `${percent}%` }} /></div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink-400">
                    <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />Last activity: {formatDate(lastActivity)}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Share Progress Modal Dialog */}
      {shareItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-progress-modal-title"
          onClick={() => setShareItem(null)}
        >
          <div
            className="card bg-white max-w-lg w-full p-6 relative shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShareItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              aria-label="Close share dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-saffron-600">
                Share Milestone
              </span>
              <h2 id="share-progress-modal-title" className="text-lg font-bold text-ink-900 mt-0.5">
                Share Your Course Progress
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                Let your network, clients, and friends celebrate your vocational skills journey.
              </p>
            </div>

            {/* Generated OG Image Preview */}
            <div className="rounded-xl overflow-hidden border border-ink-200 mb-5 bg-ink-900 relative shadow-inner">
              <img
                src={getOgImageUrl(shareItem)}
                alt={`Progress card for ${shareItem.enrollment.course.title}`}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Prominent WhatsApp Share Button */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `I'm ${shareItem.percent}% through "${shareItem.enrollment.course.title}" on Hamplard! 🎓 Check out my progress: ${getShareUrl(shareItem)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-white bg-[#25D366] hover:bg-[#1ebd5b] transition-all shadow-sm text-sm"
              >
                {/* WhatsApp SVG Icon */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.301-.778.978-.954 1.18-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.635-.93-2.242-.244-.59-.492-.51-.678-.52l-.578-.01c-.2 0-.526.075-.802.376s-1.054 1.03-1.054 2.512 1.079 2.913 1.23 3.114c.15.201 2.123 3.242 5.143 4.547.719.31 1.28.496 1.718.635.722.23 1.38.197 1.9-.12.58-.354 1.78-1.026 2.032-2.016.251-.99.251-1.838.176-2.016-.075-.178-.276-.278-.577-.428zM12.04 2C6.51 2 2.02 6.49 2.02 12.02c0 1.98.58 3.82 1.58 5.37L2 22l4.75-1.54A9.97 9.97 0 0 0 12.04 22c5.53 0 10.02-4.49 10.02-10.02S17.57 2 12.04 2zm0 18.27c-1.64 0-3.17-.46-4.48-1.26l-.32-.2-2.82.92.93-2.75-.21-.34a8.23 8.23 0 0 1-1.32-4.62c0-4.57 3.72-8.29 8.28-8.29 4.56 0 8.28 3.72 8.28 8.29 0 4.57-3.72 8.25-8.28 8.25z" />
                </svg>
                Share on WhatsApp
              </a>

              {/* Other platforms via SocialShare */}
              <div className="pt-2">
                <p className="text-xs text-ink-500 mb-2 font-medium">Or share to other platforms:</p>
                <SocialShare
                  shareText={`I'm ${shareItem.percent}% through "${shareItem.enrollment.course.title}" on Hamplard!`}
                  courseTitle={shareItem.enrollment.course.title}
                  size="md"
                />
              </div>

              {/* Copy Direct Link */}
              <button
                type="button"
                onClick={() => handleCopyLink(shareItem)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors mt-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-leaf-600" />
                    <span className="text-leaf-600">Milestone link copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-ink-500" />
                    <span>Copy Course Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

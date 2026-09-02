'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Enrollment, Lesson } from '@/types';

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
          {visibleItems.map(({ enrollment, percent, completed, total, lastActivity, nextLesson }) => {
            const href = nextLesson
              ? `/dashboard/courses/${enrollment.courseId}/learn?lesson=${encodeURIComponent(nextLesson.id)}`
              : `/dashboard/courses/${enrollment.courseId}/learn`;
            const isComplete = percent >= 100;
            return (
              <Link key={enrollment.id} href={href} className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-4 hover:shadow-lifted transition-shadow">
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
                    <span className={isComplete ? 'text-leaf-600' : 'text-saffron-700'}>{isComplete ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}</span>
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
    </div>
  );
}

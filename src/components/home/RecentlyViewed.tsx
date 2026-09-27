'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';
import { coursesApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { clearRecentlyViewed, getRecentlyViewed, recordRecentlyViewed } from '@/lib/recently-viewed';
import type { Course } from '@/types';

export function RecentlyViewedTracker({ courseId }: { courseId: string }) {
  useEffect(() => {
    recordRecentlyViewed(courseId);
  }, [courseId]);
  return null;
}

export function RecentlyViewed() {
  const isConnected = useAuthStore((state) => state.isConnected);
  const rehydrate = useAuthStore((state) => state.rehydrate);
  const [courses, setCourses] = useState<Course[]>([]);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    if (!isConnected) {
      setCourses([]);
      return;
    }

    const entries = getRecentlyViewed();
    let cancelled = false;
    Promise.all(entries.map(({ courseId }) => coursesApi.get(courseId).catch(() => null))).then(
      (results) => {
        if (!cancelled) {
          setCourses(results.filter((course): course is Course => course !== null));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isConnected]);

  const handleClear = () => {
    clearRecentlyViewed();
    setCourses([]);
    setConfirmingClear(false);
  };

  if (!isConnected || courses.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 id="recently-viewed-heading" className="section-heading">Recently viewed</h2>
          <p className="mt-1 text-sm text-ink-400">Pick up where you left off</p>
        </div>
        {confirmingClear ? (
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="text-ink-400">Clear history?</span>
            <button
              type="button"
              onClick={handleClear}
              className="font-semibold text-hamplard-primary transition-colors hover:underline"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="font-semibold text-ink-400 transition-colors hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="shrink-0 text-sm font-semibold text-ink-400 transition-colors hover:text-hamplard-primary"
          >
            Clear
          </button>
        )}
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 no-scrollbar">
        {courses.map((course) => (
          <div key={course.id} className="w-[72vw] max-w-[280px] shrink-0 snap-start sm:w-[264px]">
            <CourseCard course={course} href={`/courses/${course.id}`} />
          </div>
        ))}
        <Link
          href="/courses"
          className="flex min-h-48 w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border border-ink-100 bg-white text-sm font-semibold text-hamplard-primary transition-colors hover:bg-hamplard-lilac"
        >
          See all courses
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

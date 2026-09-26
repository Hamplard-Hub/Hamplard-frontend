"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/hooks/use-auth-store";
import { useMyEnrollments } from "@/lib/hooks/use-enrollments";
import { getRecentlyViewed } from "@/lib/recently-viewed";

export default function ContinueLearningBanner() {
  const isConnected = useAuthStore((state) => state.isConnected);
  const { data: enrollments } = useMyEnrollments();

  const [dismissed, setDismissed] = useState(false);

  const [recentCourseId, setRecentCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!enrollments) return;

    const recentlyViewed = getRecentlyViewed();

    const recentInProgressCourse = recentlyViewed.find((recent) =>
      enrollments.data.some(
        (enrollment) =>
          enrollment.courseId === recent.courseId &&
          enrollment.progressPercent > 0 &&
          enrollment.progressPercent < 100,
      ),
    );

    setRecentCourseId(recentInProgressCourse?.courseId ?? null);
  }, [enrollments]);

  if (!isConnected || dismissed || !enrollments || !recentCourseId) {
    return null;
  }

  const enrollment = enrollments.data.find(
    (item) =>
      item.courseId === recentCourseId &&
      item.progressPercent > 0 &&
      item.progressPercent < 100,
  );

  if (!enrollment) {
    return null;
  }

  const { course, progressPercent } = enrollment;

  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="relative flex items-center gap-6 rounded-2xl bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss continue learning banner"
        >
          ×
        </button>

        {course.thumbnailUrl && (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-24 w-36 rounded-lg object-cover"
          />
        )}

        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-gray-500">
            Continue Learning
          </p>

          <h2 className="text-lg font-semibold text-gray-900">
            {course.title}
          </h2>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#7F77DD]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-sm font-medium text-gray-600">
              {progressPercent}%
            </span>
          </div>
        </div>

        <a
          href={`/courses/${course.id}`}
          className="rounded-lg bg-[#7F77DD] px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          Continue
        </a>
      </div>
    </section>
  );
}

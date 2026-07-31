import Link from 'next/link';
import { coursesApi } from '@/lib/api/services';
import { formatUsdc, courseTotalMins } from '@/lib/utils';
import type { Course } from '@/types';
import RecentlyViewedTracker from '@/components/courses/RecentlyViewedTracker';
import { Breadcrumb } from '@/components/ui';

// Metadata and JSON-LD are handled by the server layout at
// src/app/courses/[id]/layout.tsx — no need to duplicate them here.

interface Props {
  params: {
    id: string;
  };
}

export default async function CoursePage({ params }: Props) {
  let course: Course | null = null;
  let error = false;

  try {
    course = await coursesApi.get(params.id);
  } catch {
    error = true;
  }

  if (!course || error) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl text-center">
          <p className="text-sm font-medium text-saffron-600 mb-3">Course not found</p>
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-4">
            This course is unavailable
          </h1>
          <p className="text-ink-500 mb-6">
            The course you are looking for could not be loaded. Please return to the homepage.
          </p>
          <Link href="/" className="btn-primary inline-flex px-6 py-3">
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  const totalMinutes = courseTotalMins(course.totalDuration ?? 0);
  const lessons = course.modules?.flatMap((module) => module.lessons).length ?? 0;

  return (
    <div className="min-h-screen bg-ink-50 px-5 py-16">
      <RecentlyViewedTracker courseId={course.id} />
      <div className="mx-auto max-w-6xl space-y-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course.title },
          ]}
          className="mb-2"
        />

        <div className="grid gap-10 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-saffron-100 to-saffron-200 aspect-video">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">🎓</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-ink-500">
                <span className="rounded-full border border-ink-200 bg-white px-3 py-1.5 font-medium text-ink-600">
                  {course.category}
                </span>
                <span className="rounded-full border border-ink-200 bg-white px-3 py-1.5 font-medium text-ink-600">
                  {course.level}
                </span>
                <span className="rounded-full border border-ink-200 bg-white px-3 py-1.5 font-medium text-ink-600">
                  {course.language}
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold text-ink-900">{course.title}</h1>
              <p className="text-lg leading-relaxed text-ink-500">
                {course.description ??
                  'A practical Hamplard course with verified lessons and certification.'}
              </p>
            </div>
          </div>

          <aside className="space-y-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-400">
                Course details
              </p>
              <div className="text-sm text-ink-600">
                <p>
                  <span className="font-medium text-ink-900">Price:</span>{' '}
                  {formatUsdc(course.price)} USDC
                </p>
                <p>
                  <span className="font-medium text-ink-900">Lessons:</span> {lessons}
                </p>
                <p>
                  <span className="font-medium text-ink-900">Duration:</span> {totalMinutes} min
                </p>
                <p>
                  <span className="font-medium text-ink-900">Instructor:</span>{' '}
                  {course.instructor?.name ?? 'Hamplard Instructor'}
                </p>
              </div>
            </div>
            <Link href="/auth/login" className="btn-primary w-full text-center px-5 py-3">
              Sign in to enroll
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';

export default function CourseDetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    coursesApi.get(id)
      .then((c) => setCourse(c))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return <div className="p-6">Missing course id</div>;

  if (loading) return (
    <div className="p-6">
      <div className="h-48 bg-ink-100 rounded-md animate-pulse" />
      <div className="mt-4 space-y-2">
        <div className="h-6 bg-ink-100 w-1/3 rounded animate-pulse" />
        <div className="h-4 bg-ink-100 w-1/4 rounded animate-pulse" />
        <div className="h-3 bg-ink-100 w-full rounded animate-pulse" />
      </div>
    </div>
  );

  if (!course) return (
    <div className="card p-8 text-center">
      <p className="text-sm font-medium text-ink-700">Course not found</p>
    </div>
  );

  const sampleModules = [
    { id: 'm1', title: 'Introduction', lessons: ['Welcome', 'How to use this course'] },
    { id: 'm2', title: 'Basics', lessons: ['Lesson 1', 'Lesson 2', 'Lesson 3'] },
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      <main className="col-span-12 lg:col-span-8">
        {/* Banner */}
        <div className="rounded-xl overflow-hidden bg-gradient-to-br from-saffron-100 to-saffron-200 mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-36 h-24 bg-ink-100 rounded-md flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-semibold text-ink-900">{course.title}</h1>
                <p className="text-sm text-ink-500 mt-1">{course.subtitle ?? course.description?.slice(0, 140)}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
                  <span>{course.rating ?? '—'} ★</span>
                  <span>{course._count?.enrollments ?? 0} students</span>
                  <span className="capitalize">{course.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What you'll learn */}
        <section className="card p-5 mb-6">
          <h2 className="text-lg font-semibold">What you'll learn</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>Understand the fundamentals</li>
            <li>Build real projects</li>
            <li>Prepare for assessments</li>
          </ul>
        </section>

        {/* Curriculum accordion */}
        <section className="card p-5 mb-6">
          <h2 className="text-lg font-semibold">Curriculum</h2>
          <div className="mt-3 space-y-2">
            {sampleModules.map((m) => (
              <details key={m.id} className="group border border-ink-100 rounded-lg p-3">
                <summary className="cursor-pointer list-none font-medium">{m.title}</summary>
                <ul className="mt-2 ml-3 text-sm text-ink-600 space-y-1">
                  {m.lessons.map((l, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{l}</span>
                      <span className="text-xs text-ink-400">5m</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>

        {/* Instructor */}
        <section className="card p-5 mb-6">
          <h2 className="text-lg font-semibold">Instructor</h2>
          <div className="flex items-center gap-4 mt-3">
            <div className="w-12 h-12 rounded-full bg-ink-100" />
            <div>
              <div className="font-medium text-ink-900">{course.instructor?.name ?? 'Instructor'}</div>
              <div className="text-xs text-ink-500">{course.instructor?.bio ?? 'No bio available'}</div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="card p-5 mb-6">
          <h2 className="text-lg font-semibold">Student reviews</h2>
          <div className="mt-3 space-y-3">
            <div className="border border-ink-100 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-ink-100" />
                <div>
                  <div className="text-sm font-medium">Great course</div>
                  <div className="text-xs text-ink-500 mt-1">Really enjoyed the hands-on projects.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related */}
        <section>
          <h2 className="section-heading">Related courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-3">
            {/* Example using CourseCard if available */}
            <CourseCard course={course} />
          </div>
        </section>
      </main>

      {/* Sticky right sidebar */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="sticky top-6 space-y-4">
          <div className="card p-4">
            <div className="w-full h-40 bg-ink-100 rounded-md mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{course.title}</div>
                <div className="text-xs text-ink-500 mt-1">{course.instructor?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-ink-900">{course.price ? `$${(course.price / 100).toFixed(2)}` : 'Free'}</div>
                <div className="text-xs text-ink-400">One-time</div>
              </div>
            </div>
            <button className="btn-primary w-full mt-4">Enroll now</button>
            <button className="btn-secondary w-full mt-2">Preview course</button>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Course highlights</h3>
            <ul className="text-sm text-ink-600 mt-2 space-y-1">
              <li>Lifetime access</li>
              <li>Certificate of completion</li>
              <li>30-day money-back</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-ink-100 lg:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium">{course.title}</div>
            <div className="text-xs text-ink-500">{course.price ? `$${(course.price / 100).toFixed(2)}` : 'Free'}</div>
          </div>
          <button className="btn-primary px-4 py-2">Enroll</button>
        </div>
      </div>
    </div>
  );
}

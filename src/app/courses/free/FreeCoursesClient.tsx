'use client';

import { useEffect, useMemo, useState } from 'react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseCardSkeleton } from '@/components/courses/CourseCardSkeleton';
import type { Course } from '@/types';

const PAGE_SIZE = 24;
const API_PAGE_SIZE = 100;

export function FreeCoursesClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setLoading(true);
        setHasError(false);

        const firstPage = await coursesApi.list({
          page: 1,
          limit: API_PAGE_SIZE,
        });

        const allCourses = [...firstPage.data];

        for (let currentPage = 2; currentPage <= firstPage.meta.totalPages; currentPage++) {
          const result = await coursesApi.list({
            page: currentPage,
            limit: API_PAGE_SIZE,
          });

          allCourses.push(...result.data);
        }

        const freeCourses = allCourses.filter(
          (course) => Number(course.price) === 0,
        );

        if (!cancelled) {
          setCourses(freeCourses);
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(courses.map((course) => course.category).filter(Boolean)),
    ).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (category === 'All') {
      return courses;
    }

    return courses.filter((course) => course.category === category);
  }, [courses, category]);

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);

  const visibleCourses = filteredCourses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setPage(1);
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-12 xl:px-10">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-hamplard-primary">
          Free learning
        </p>

        <h1 className="font-display text-3xl font-bold text-ink-900 md:text-4xl">
          Free Courses — Learn Without Spending
        </h1>

        <p className="mt-3 text-ink-600">
          Explore practical courses you can start learning at no cost.
        </p>
      </div>

      {!loading && categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {['All', ...categories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                category === item
                  ? 'border-hamplard-primary bg-hamplard-primary text-white'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-hamplard-primary'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && hasError && (
        <div className="mt-10 rounded-xl border border-ink-200 bg-white p-8 text-center">
          <p className="font-semibold text-ink-900">
            Unable to load courses.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Please try again later.
          </p>
        </div>
      )}

      {!loading && !hasError && visibleCourses.length === 0 && (
        <div className="mt-10 rounded-xl border border-ink-200 bg-white p-8 text-center">
          <p className="font-semibold text-ink-900">
            No free courses found.
          </p>
        </div>
      )}

      {!loading && !hasError && visibleCourses.length > 0 && (
        <>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {visibleCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                href={`/courses/${course.id}`}
                freeCta
                priority={index < 4}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-ink-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
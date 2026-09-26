"use client";

import { useEffect, useMemo, useState } from "react";
import { coursesApi } from "@/lib/api/services";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseCardSkeleton } from "@/components/courses/CourseCardSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

const PAGE_SIZE = 24;
const FETCH_SIZE = 100;
const NEW_RELEASE_WINDOW_DAYS = 90;

export function NewReleasesClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setLoading(true);
        setError(false);

        const firstPage = await coursesApi.list({
          page: 1,
          limit: FETCH_SIZE,
        });

        let allCourses = [...firstPage.data];

        if (firstPage.meta.totalPages > 1) {
          const remainingRequests = Array.from(
            { length: firstPage.meta.totalPages - 1 },
            (_, index) =>
              coursesApi.list({
                page: index + 2,
                limit: FETCH_SIZE,
              }),
          );

          const remainingPages = await Promise.all(remainingRequests);

          remainingPages.forEach((response) => {
            allCourses = [...allCourses, ...response.data];
          });
        }

        if (!cancelled) {
          setCourses(allCourses);
        }
      } catch {
        if (!cancelled) {
          setCourses([]);
          setError(true);
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

  const recentCourses = useMemo(() => {
    const now = Date.now();
    const cutoff = now - NEW_RELEASE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    return courses
      .filter((course) => {
        if (!course.publishedAt) return false;

        const publishedAt = new Date(course.publishedAt).getTime();

        return (
          !Number.isNaN(publishedAt) &&
          publishedAt >= cutoff &&
          publishedAt <= now
        );
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt!).getTime() -
          new Date(a.publishedAt!).getTime(),
      );
  }, [courses]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(recentCourses.map((course) => course.category)),
      ).sort(),
    [recentCourses],
  );

  const filteredCourses = useMemo(() => {
    if (!selectedCategory) return recentCourses;

    return recentCourses.filter(
      (course) => course.category === selectedCategory,
    );
  }, [recentCourses, selectedCategory]);

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, currentPage]);

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-saffron-600">
            Recently published
          </p>

          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
            New Releases
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-ink-500 sm:text-base">
            Explore the latest courses published on Hamplard within the last 90
            days.
          </p>
        </header>

        {!loading && !error && categories.length > 0 && (
          <div
            className="mb-8 flex flex-wrap gap-2"
            aria-label="Filter courses by category"
          >
            <button
              type="button"
              onClick={() => handleCategoryChange("")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                selectedCategory === ""
                  ? "border-saffron-500 bg-saffron-500 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-saffron-300 hover:text-saffron-700",
              )}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategory === category
                    ? "border-saffron-500 bg-saffron-500 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:border-saffron-300 hover:text-saffron-700",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-ink-200 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-ink-900">
              Unable to load new releases
            </h2>
            <p className="mt-2 text-sm text-ink-500">Please try again later.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-xl border border-ink-200 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-ink-900">
              No new releases found
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              There are no courses published in this category within the last 90
              days.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-ink-500">
              {filteredCourses.length}{" "}
              {filteredCourses.length === 1 ? "course" : "courses"} found
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={{
                    ...course,
                    badge: "new",
                  }}
                  href={`/courses/${course.id}`}
                  priority={currentPage === 1 && index < 4}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={PAGE_SIZE}
              onPageChange={handlePageChange}
              updateUrl={false}
              className="mt-10"
            />
          </>
        )}
      </div>
    </main>
  );
}

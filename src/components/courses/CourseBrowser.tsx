'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCardGrid } from './CourseCardGrid';
import { CourseCardSkeleton } from '@/components/skeletons';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import type { Course, Category } from '@/types';

const PAGE_SIZE = 8;

interface Props {
  showFilters?: boolean;
}

export function CourseBrowser({ showFilters = true }: Props) {
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore] = useState(false);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [level,      setLevel]      = useState('');

  // Fetch categories once
  useEffect(() => {
    coursesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Reset and fetch first page whenever filters change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    setCourses([]);

    coursesApi
      .list({
        search:   search   || undefined,
        category: category || undefined,
        level:    level    || undefined,
        page:     1,
        limit:    PAGE_SIZE,
      })
      .then((r) => {
        setCourses(r.data);
        // If a full page came back, assume there are more pages
        setHasMore(r.data.length >= PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, level]);

  // Load the next page and append results
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const r = await coursesApi.list({
        search:   search   || undefined,
        category: category || undefined,
        level:    level    || undefined,
        page:     nextPage,
        limit:    PAGE_SIZE,
      });

      if (r.data.length === 0) {
        setHasMore(false);
      } else {
        // Deduplicate by id in case of any race condition
        setCourses((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const fresh = r.data.filter((c) => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setHasMore(r.data.length >= PAGE_SIZE);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, search, category, level]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    loading: loadingMore,
    hasMore,
  });

  return (
    <div>
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select w-auto"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="select w-auto"
          >
            <option value="">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      )}

      {/* Initial load skeleton */}
      {loading ? (
        <CourseCardGrid courses={[]} loading skeletons={PAGE_SIZE} />
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-ink-400">
          <p className="text-sm">No courses found. Try a different search.</p>
        </div>
      ) : (
        <>
          <CourseCardGrid courses={courses} />

          {/* "Load more" skeleton row — 4 cards wide */}
          {loadingMore && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4"
              aria-live="polite"
              aria-label="Loading more courses"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* End-of-list message */}
          {!hasMore && !loadingMore && (
            <p className="text-center text-sm text-ink-400 py-8 select-none">
              You've seen all courses
            </p>
          )}

          {/* Invisible sentinel — triggers IntersectionObserver */}
          <div ref={sentinelRef} aria-hidden="true" className="h-1" />
        </>
      )}
    </div>
  );
}

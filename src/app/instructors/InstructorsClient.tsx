'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RefreshCw, Search, X } from 'lucide-react';
import { coursesApi, instructorsApi } from '@/lib/api/services';
import { InstructorCard } from '@/components/instructors/InstructorCard';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import type { Category, Instructor, InstructorSort } from '@/types';

const SORT_OPTIONS: { label: string; value: InstructorSort }[] = [
  { label: 'Highest Rated', value: 'rated' },
  { label: 'Most Students', value: 'popular' },
  { label: 'Most Courses', value: 'courses' },
];

const PAGE_SIZE = 12;

/** Placeholder card used while the first page loads. */
function InstructorCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-ink-100 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-2/3 rounded bg-ink-100" />
          <div className="h-3 w-1/2 rounded bg-ink-100" />
          <div className="h-5 w-20 rounded bg-ink-100" />
        </div>
      </div>
      <div className="mt-4 h-3 w-1/2 rounded bg-ink-100" />
      <div className="mt-4 pt-4 border-t border-ink-100 flex gap-4">
        <div className="h-3 w-24 rounded bg-ink-100" />
        <div className="h-3 w-20 rounded bg-ink-100" />
      </div>
    </div>
  );
}

/**
 * InstructorsClient
 *
 * The `/instructors` directory: free-text search, a category filter and a sort
 * order, all mirrored into the URL so a filtered view can be shared or
 * bookmarked. Results load page by page through the shared infinite-scroll
 * hook.
 */
export function InstructorsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const urlSort = (searchParams.get('sort') as InstructorSort | null) ?? 'rated';

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    coursesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchFirstPage = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    setPage(1);

    instructorsApi
      .list({
        search: urlSearch || undefined,
        category: urlCategory || undefined,
        sort: urlSort,
        page: 1,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        const items = res.data ?? [];
        setInstructors(items);
        setTotal(res.meta?.total ?? items.length);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch(() => {
        setInstructors([]);
        setTotal(0);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [urlSearch, urlCategory, urlSort]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await instructorsApi.list({
        search: urlSearch || undefined,
        category: urlCategory || undefined,
        sort: urlSort,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      const items = res.data ?? [];
      if (items.length === 0) {
        setHasMore(false);
      } else {
        setInstructors((prev) => {
          const seen = new Set(prev.map((instructor) => instructor.id));
          return [...prev, ...items.filter((instructor) => !seen.has(instructor.id))];
        });
        setPage(nextPage);
        setHasMore(items.length >= PAGE_SIZE);
      }
    } catch {
      // Failed load — the sentinel stays visible so the user can retry.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, urlSearch, urlCategory, urlSort]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    loading: loadingMore,
    hasMore,
  });

  const clearAll = () => updateParams({ search: '', category: '', sort: '' });

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="section-heading mb-1">Instructors</h1>
          <p className="text-sm text-ink-400">
            Learn from experienced practitioners across tailoring, makeup, baking, photography and
            more.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="mb-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateParams({ search: (fd.get('q') as string) ?? '' });
            }}
            className="flex gap-2 max-w-lg"
          >
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                name="q"
                defaultValue={urlSearch}
                key={urlSearch}
                placeholder="Search instructors…"
                aria-label="Search instructors"
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary px-5">
              Search
            </button>
          </form>
        </div>

        {/* ── Category filter ── */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h2 className="sr-only">Filter by category</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateParams({ category: '' })}
                aria-pressed={urlCategory === ''}
                className={`rounded-pill px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                  urlCategory === ''
                    ? 'bg-hamplard-primary text-white border-hamplard-primary'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-hamplard-primary hover:text-hamplard-primary'
                }`}
              >
                All
              </button>
              {categories.map((category) => {
                const active = urlCategory === category.name;
                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => updateParams({ category: active ? '' : category.name })}
                    aria-pressed={active}
                    className={`rounded-pill px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-hamplard-primary text-white border-hamplard-primary'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-hamplard-primary hover:text-hamplard-primary'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Result count + sort ── */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="text-sm text-ink-500">
            {loading ? (
              <span className="inline-block w-24 h-4 rounded bg-ink-100 animate-pulse" />
            ) : (
              <>
                <span className="font-semibold text-ink-900">{total.toLocaleString()}</span>{' '}
                {total === 1 ? 'instructor' : 'instructors'}
              </>
            )}
          </p>

          <select
            value={urlSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="select w-auto text-sm"
            aria-label="Sort instructors"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Active filters ── */}
        {(urlSearch || urlCategory) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {urlSearch && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-saffron-50 text-saffron-700 text-xs font-medium border border-saffron-200">
                &ldquo;{urlSearch}&rdquo;
                <button
                  type="button"
                  onClick={() => updateParams({ search: '' })}
                  aria-label="Remove search filter"
                  className="hover:text-saffron-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {urlCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-saffron-50 text-saffron-700 text-xs font-medium border border-saffron-200">
                {urlCategory}
                <button
                  type="button"
                  onClick={() => updateParams({ category: '' })}
                  aria-label="Remove category filter"
                  className="hover:text-saffron-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-ink-400 hover:text-ink-700 underline self-center"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <InstructorCardSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          <div className="card p-14 text-center">
            <p className="text-sm font-medium text-ink-700">Failed to load instructors</p>
            <p className="text-xs text-ink-400 mt-1">Check your connection and try again.</p>
            <button onClick={fetchFirstPage} className="btn-primary mt-4 inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        ) : instructors.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="text-sm font-medium text-ink-700">No instructors found</p>
            <p className="text-xs text-ink-400 mt-1">
              Try a different search term or clear the category filter.
            </p>
            <button onClick={clearAll} className="btn-primary mt-4 inline-flex">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {instructors.map((instructor, index) => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))}
            </div>

            {loadingMore && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5"
                aria-live="polite"
                aria-label="Loading more instructors"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <InstructorCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!hasMore && !loadingMore && (
              <p className="text-center text-sm text-ink-400 py-10 select-none">
                You&apos;ve seen all instructors
              </p>
            )}

            <div ref={sentinelRef} aria-hidden="true" className="h-1" />
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseCardSkeleton } from '@/components/skeletons';
import { FilterSidebar } from '@/components/courses/FilterSidebar';
import { Pagination } from '@/components/ui/Pagination';
import { CompareBar } from '@/components/courses/CompareBar';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { cn } from '@/lib/utils';
import type { Course, Category } from '@/types';

// ── Constants ─────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Most Relevant', value: 'relevant' },
  { label: 'Highest Rated', value: 'rated'    },
  { label: 'Most Popular',  value: 'popular'  },
  { label: 'Newest',        value: 'newest'   },
] as const;

const PAGE_SIZE = 12;

// ── Active filter chip ────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-saffron-50 text-saffron-700 text-xs font-medium border border-saffron-200">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="hover:text-saffron-900 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function CourseBrowsePage() {
  const router       = useRouter();
  const pathname     = usePathname();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink-50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-ink-100" />
            <div className="h-12 w-full max-w-lg rounded-xl bg-ink-100" />
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="h-80 rounded-xl bg-ink-100" />
              <div className="space-y-4">
                <div className="h-10 w-40 rounded bg-ink-100" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-56 rounded-xl bg-ink-100" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CourseBrowsePageContent />
    </Suspense>
  );
}

function CourseBrowsePageContent() {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL
  const urlCategory = searchParams.get('category') ?? '';
  const urlLevel    = searchParams.get('level')    ?? '';
  const urlPrice    = searchParams.get('price')    ?? '';
  const urlRating   = searchParams.get('rating')   ?? '';
  const urlDuration = searchParams.get('duration') ?? '';
  const urlSort     = searchParams.get('sort')     ?? 'relevant';
  const urlSearch   = searchParams.get('search')   ?? '';

  const [courses,     setCourses]     = useState<Course[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loading,     setLoading]     = useState(true);   // first-page load
  const [loadingMore, setLoadingMore] = useState(false);  // subsequent pages
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync filter changes to URL using router.replace (prevents polluting history stack)
  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) { params.set(k, v); }
      else   { params.delete(k); }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch categories once
  useEffect(() => {
    coursesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Helper: apply client-side sort & price filter
  const applyClientFilters = useCallback((data: Course[]): Course[] => {
    let sorted = [...data];
    if (urlSort === 'popular') {
      sorted.sort((a, b) => (b.totalEnrollments ?? 0) - (a.totalEnrollments ?? 0));
    } else if (urlSort === 'newest') {
      sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    if (urlPrice) {
      sorted = sorted.filter((c) => {
        const p = Number(c.price);
        if (urlPrice === 'free')    return p === 0;
        if (urlPrice === 'under20') return p > 0 && p < 20;
        if (urlPrice === '20to50')  return p >= 20 && p <= 50;
        if (urlPrice === 'over50')  return p > 50;
        return true;
      });
    }
    if (urlRating) {
      const minRating = Number(urlRating);
      if (!isNaN(minRating)) {
        sorted = sorted.filter((c) => (c.rating ?? 0) >= minRating);
      }
    }
    return sorted;
  }, [urlSort, urlPrice, urlRating]);

  // Initial / filter change fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

    coursesApi.list({
      category: urlCategory || undefined,
      level:    urlLevel    || undefined,
      search:   urlSearch   || undefined,
      page: 1,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        const filtered = applyClientFilters(res.courses);
        setCourses(filtered);
        setTotal(res.total);
        setHasMore(res.courses.length === PAGE_SIZE && filtered.length < res.total);
      })
      .catch(() => {
        if (cancelled) return;
        setCourses([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [urlCategory, urlLevel, urlSearch, applyClientFilters]);

  // Read current page from URL parameter
  const urlPageParam = searchParams.get('page');
  const urlPage = urlPageParam ? parseInt(urlPageParam, 10) : 1;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  // Load next page and append
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await coursesApi.list({
        search:   urlSearch   || undefined,
        category: urlCategory || undefined,
        level:    urlLevel    || undefined,
        page:     nextPage,
        limit:    PAGE_SIZE,
      });

      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        const filtered = applyClientFilters(res.data);
        setCourses((prev) => {
          // Deduplicate — guard against race conditions
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...filtered.filter((c) => !seen.has(c.id))];
        });
        setPage(nextPage);
        setHasMore(res.data.length >= PAGE_SIZE);
      }
    } catch {
      // silently ignore network errors
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, urlSearch, urlCategory, urlLevel, applyClientFilters]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    loading: loadingMore,
    hasMore,
  });

  // Active filter chips
  const activeChips: { label: string; clear: () => void }[] = [];
  if (urlSearch)   activeChips.push({ label: `"${urlSearch}"`,   clear: () => updateParams({ search: '' }) });
  if (urlCategory) activeChips.push({ label: urlCategory,        clear: () => updateParams({ category: '' }) });
  if (urlLevel)    activeChips.push({ label: urlLevel,           clear: () => updateParams({ level: '' }) });
  if (urlPrice) {
    const priceLabel =
      { free: 'Free', under20: 'Under $20', '20to50': '$20–$50', over50: 'Over $50' }[urlPrice] ??
      urlPrice;
    activeChips.push({ label: priceLabel, clear: () => updateParams({ price: '' }) });
  }
  if (urlRating) {
    activeChips.push({ label: `★ ${urlRating} & up`, clear: () => updateParams({ rating: '' }) });
  }
  if (urlDuration) {
    const durationLabel = { short: '0–2h', medium: '3–6h', long: '7h+' }[urlDuration] ?? urlDuration;
    activeChips.push({ label: durationLabel, clear: () => updateParams({ duration: '' }) });
  }

  const clearAll = () =>
    updateParams({ search: '', category: '', level: '', price: '', rating: '', duration: '', sort: '' });

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="section-heading mb-1">Browse Courses</h1>
          <p className="text-sm text-ink-400">
            Discover skills from expert instructors across Africa and beyond.
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateParams({ search: (fd.get('q') as string) ?? '' });
            }}
            className="flex gap-2 max-w-lg"
          >
            <input
              name="q"
              defaultValue={urlSearch}
              key={urlSearch}
              placeholder="Search courses…"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary px-5">
              Search
            </button>
          </form>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Filter sidebar ── */}
          <FilterSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            categories={categories}
            activeCategory={urlCategory}
            activeLevel={urlLevel}
            activePrice={urlPrice}
            activeRating={urlRating}
            activeDuration={urlDuration}
            onCategory={(v) => updateParams({ category: v })}
            onLevel={(v)    => updateParams({ level: v })}
            onPrice={(v)    => updateParams({ price: v })}
            onRating={(v)   => updateParams({ rating: v })}
            onDuration={(v) => updateParams({ duration: v })}
            onClearAll={clearAll}
          />

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar: results count + sort + mobile filter toggle */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mobile filter button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden btn-secondary flex items-center gap-2 text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeChips.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-saffron-500 text-white text-[10px] flex items-center justify-center">
                      {activeChips.length}
                    </span>
                  )}
                </button>

                {/* Results count */}
                <p className="text-sm text-ink-500">
                  {loading ? (
                    <span className="inline-block w-24 h-4 rounded bg-ink-100 animate-pulse" />
                  ) : (
                    <>
                      <span className="font-semibold text-ink-900">{total.toLocaleString()}</span>{' '}
                      results
                    </>
                  )}
                </p>
              </div>

              {/* Sort dropdown */}
              <select
                value={urlSort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="select w-auto text-sm"
                aria-label="Sort courses"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeChips.map((chip) => (
                  <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
                ))}
                <button
                  onClick={clearAll}
                  className="text-xs text-ink-400 hover:text-ink-700 underline self-center"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── Course grid ── */}
            {loading ? (
              /* First-page skeleton — 4-column grid of 8 cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="card p-14 text-center">
                <p className="text-sm font-medium text-ink-700">No courses found</p>
                <p className="text-xs text-ink-400 mt-1">
                  Try adjusting your filters or search term.
                </p>
                <button onClick={clearAll} className="btn-primary mt-4 inline-flex">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {courses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    priority={index < 4}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={urlPage}
              totalPages={totalPages}
              onPageChange={p => updateParams({ page: String(p) })}
              className="mt-10"
            />
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Skeleton row while next page loads */}
                {loadingMore && (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5"
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
                  <p className="text-center text-sm text-ink-400 py-10 select-none">
                    You've seen all courses
                  </p>
                )}

                {/* Invisible sentinel — IntersectionObserver watches this */}
                <div ref={sentinelRef} aria-hidden="true" className="h-1" />
              </>
            )}
          </div>
        </div>
      </div>
      <CompareBar />
    </div>
  );
}

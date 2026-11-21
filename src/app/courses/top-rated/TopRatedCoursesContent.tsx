'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { X, Award } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseCardSkeleton } from '@/components/skeletons';
import { Pagination } from '@/components/ui/Pagination';
import { CompareBar } from '@/components/courses/CompareBar';
import { cn } from '@/lib/utils';
import type { Course, Category } from '@/types';

// ── Constants ─────────────────────────────────────────────────────
const PAGE_SIZE = 24;
const MIN_RATING = 4.5;

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

// ── Main content component ────────────────────────────────────────
export function TopRatedCoursesContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL
  const urlCategory = searchParams.get('category') ?? '';
  const urlPage = searchParams.get('page');
  const currentPage = urlPage ? parseInt(urlPage, 10) : 1;

  const [courses,     setCourses]     = useState<Course[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);

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

  // Fetch courses with rating filter
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Fetch a large batch of courses to filter by rating client-side
    // Since the API doesn't support rating filtering, we fetch a large set
    coursesApi.list({
      category: urlCategory || undefined,
      page: 1,
      limit: 200, // Fetch many courses to have enough with 4.5+ rating
    })
      .then((res) => {
        if (cancelled) return;
        
        // Filter courses with 4.5+ rating
        const topRated = res.data.filter((course) => (course.rating ?? 0) >= MIN_RATING);
        
        // Sort by rating descending
        const sorted = topRated.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        
        // Paginate client-side
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const paginated = sorted.slice(startIndex, endIndex);
        
        setCourses(paginated);
        setTotal(sorted.length);
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
  }, [urlCategory, currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  // Active filter chips
  const activeChips: { label: string; clear: () => void }[] = [];
  if (urlCategory) {
    activeChips.push({ 
      label: urlCategory, 
      clear: () => updateParams({ category: '', page: '' }) 
    });
  }

  const clearAll = () => updateParams({ category: '', page: '' });

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Hero section ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-saffron-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-ink-900">
              Top Rated Courses on Hamplard
            </h1>
          </div>
          <p className="text-base text-ink-600 max-w-2xl">
            Explore our highest-rated courses with {MIN_RATING}+ star ratings. 
            Learn from the best instructors across Africa and beyond.
          </p>
        </div>

        {/* ── Category filter pills ── */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateParams({ category: '', page: '' })}
              className={cn(
                'px-4 py-2 rounded-pill text-sm font-medium transition-all',
                !urlCategory
                  ? 'bg-saffron-600 text-white shadow-sm'
                  : 'bg-white text-ink-700 border border-ink-200 hover:border-saffron-300 hover:bg-saffron-50'
              )}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => updateParams({ category: cat.name, page: '' })}
                className={cn(
                  'px-4 py-2 rounded-pill text-sm font-medium transition-all',
                  urlCategory === cat.name
                    ? 'bg-saffron-600 text-white shadow-sm'
                    : 'bg-white text-ink-700 border border-ink-200 hover:border-saffron-300 hover:bg-saffron-50'
                )}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count & active filters ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="text-sm text-ink-500">
              {loading ? (
                <span className="inline-block w-32 h-4 rounded bg-ink-100 animate-pulse" />
              ) : (
                <>
                  <span className="font-semibold text-ink-900">{total.toLocaleString()}</span>{' '}
                  top-rated {total === 1 ? 'course' : 'courses'}
                </>
              )}
            </p>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-ink-500">Active filters:</span>
                {activeChips.map((chip) => (
                  <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
                ))}
                <button
                  onClick={clearAll}
                  className="text-xs text-ink-400 hover:text-ink-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Course grid ── */}
        {loading ? (
          /* Loading skeleton — 24 cards in 4-column grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card p-14 text-center">
            <Award className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-ink-700">No top-rated courses found</p>
            <p className="text-xs text-ink-400 mt-1">
              Try selecting a different category or check back later.
            </p>
            {urlCategory && (
              <button onClick={clearAll} className="btn-primary mt-4 inline-flex">
                View all top-rated courses
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {courses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  priority={index < 4}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => updateParams({ page: String(p) })}
                className="mt-10"
              />
            )}
          </>
        )}
      </div>
      
      <CompareBar />
    </div>
  );
}

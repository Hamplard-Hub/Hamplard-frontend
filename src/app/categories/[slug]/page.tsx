'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseCardSkeleton } from '@/components/courses/CourseCardSkeleton';
import { FilterSidebar } from '@/components/courses/FilterSidebar';
import { CategoryHero, getCategoryMeta, CATEGORY_META } from '@/components/category/CategoryHero';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import type { Course, Category } from '@/types';

// ── Constants ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 48; // fetch enough for a static single-page view

// ── Subcategory helpers ────────────────────────────────────────────────────

/**
 * Derive up-to-8 subcategory pill labels from frequent meaningful words
 * that appear in ≥2 course titles within this category.
 */
function deriveSubcategories(courses: Course[], categoryName: string): string[] {
  const stop = new Set([
    'and', 'the', 'of', 'for', 'in', 'a', 'an', 'to', 'with',
    'on', 'how', 'your', 'you', 'from', 'using', 'part',
    categoryName.toLowerCase(),
    ...categoryName.toLowerCase().split(' '),
  ]);

  const counts = new Map<string, number>();
  for (const c of courses) {
    const words = c.title.toLowerCase().split(/\W+/);
    for (const word of words) {
      if (word.length > 3 && !stop.has(word)) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CategoryPage() {
  const params     = useParams<{ slug: string }>();
  const slug       = params.slug;
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const meta = getCategoryMeta(slug);

  // ── URL-driven filter state ────────────────────────────────────────────
  const activeSub      = searchParams.get('sub')      ?? '';
  const activeSort     = searchParams.get('sort')     ?? 'popular';
  const activeLevel    = searchParams.get('level')    ?? '';
  const activePrice    = searchParams.get('price')    ?? '';
  const activeRating   = searchParams.get('rating')   ?? '';
  const activeDuration = searchParams.get('duration') ?? '';

  // ── Data ──────────────────────────────────────────────────────────────
  const [allCourses,  setAllCourses]  = useState<Course[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invalid,     setInvalid]     = useState(false);

  // Helper: push updated params to the URL without full navigation
  const updateParams = useCallback((updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else   p.delete(k);
    });
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch all courses in this category + the categories list (for sidebar)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      coursesApi.list({ category: meta.name, limit: PAGE_SIZE }),
      coursesApi.getCategories(),
    ])
      .then(([res, cats]) => {
        if (cancelled) return;
        const courses = res.data ?? [];
        // 404 for unknown slug with zero courses
        if (courses.length === 0 && !(slug in CATEGORY_META)) {
          setInvalid(true);
          return;
        }
        setAllCourses(courses);
        setCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setInvalid(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  // Re-fetch when the category slug changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Subcategory pills — derived from fetched course titles
  const subcategories = useMemo(
    () => deriveSubcategories(allCourses, meta.name),
    [allCourses, meta.name],
  );

  // ── Client-side filter + sort ──────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...allCourses];

    // Subcategory keyword filter
    if (activeSub) {
      list = list.filter((c) =>
        c.title.toLowerCase().includes(activeSub.toLowerCase()),
      );
    }

    // Level filter
    if (activeLevel) {
      list = list.filter((c) =>
        c.level?.toLowerCase() === activeLevel.toLowerCase(),
      );
    }

    // Price filter
    if (activePrice) {
      list = list.filter((c) => {
        const p = Number(c.price);
        if (activePrice === 'free')    return p === 0;
        if (activePrice === 'under20') return p > 0 && p < 20;
        if (activePrice === '20to50')  return p >= 20 && p <= 50;
        if (activePrice === 'over50')  return p > 50;
        return true;
      });
    }

    // Rating filter
    if (activeRating) {
      const min = parseFloat(activeRating);
      if (!isNaN(min)) list = list.filter((c) => (c.rating ?? 0) >= min);
    }

    // Duration filter
    if (activeDuration) {
      list = list.filter((c) => {
        const hrs = (c.totalDuration ?? 0) / 3600;
        if (activeDuration === 'short')  return hrs <= 2;
        if (activeDuration === 'medium') return hrs > 2 && hrs <= 6;
        if (activeDuration === 'long')   return hrs > 6;
        return true;
      });
    }

    // Sort
    if (activeSort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeSort === 'rated') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else {
      // popular (default)
      list.sort((a, b) => (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0));
    }

    return list;
  }, [allCourses, activeSub, activeLevel, activePrice, activeRating, activeDuration, activeSort]);

  const clearAll = () =>
    updateParams({ sub: '', level: '', price: '', rating: '', duration: '', sort: '' });

  // ── 404 ───────────────────────────────────────────────────────────────
  if (invalid) notFound();

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ink-50">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <CategoryHero slug={slug} courseCount={allCourses.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Subcategory pills ──────────────────────────────────────── */}
        {(loading || subcategories.length > 0) && (
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none"
            role="group"
            aria-label="Subcategory filters"
          >
            {/* "All" pill */}
            <button
              onClick={() => updateParams({ sub: '' })}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
                !activeSub
                  ? 'bg-[#26215C] text-white border-[#26215C] shadow-sm'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-[#26215C] hover:text-[#26215C]',
              )}
              aria-pressed={!activeSub}
            >
              All
            </button>

            {loading
              ? // Skeleton pills while loading
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 h-9 w-20 rounded-full bg-ink-100 animate-pulse"
                    aria-hidden="true"
                  />
                ))
              : subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() =>
                      updateParams({ sub: activeSub === sub ? '' : sub })
                    }
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
                      activeSub === sub
                        ? 'bg-[#26215C] text-white border-[#26215C] shadow-sm'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-[#26215C] hover:text-[#26215C]',
                    )}
                    aria-pressed={activeSub === sub}
                  >
                    {sub}
                  </button>
                ))}
          </div>
        )}

        {/* ── Main layout: sidebar + grid ───────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* FilterSidebar (desktop sticky / mobile drawer) */}
          <FilterSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            categories={categories}
            activeCategory={meta.name}   // lock to this category
            activeLevel={activeLevel}
            activePrice={activePrice}
            activeRating={activeRating}
            activeDuration={activeDuration}
            onCategory={() => {}}        // category locked on this page
            onLevel={(v)    => updateParams({ level: v })}
            onPrice={(v)    => updateParams({ price: v })}
            onRating={(v)   => updateParams({ rating: v })}
            onDuration={(v) => updateParams({ duration: v })}
            onClearAll={clearAll}
          />

          {/* Main content */}
          <main className="flex-1 min-w-0" id="main-content">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden btn-secondary flex items-center gap-2 text-sm"
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                  Filters
                </button>

                {/* Result count */}
                <p className="text-sm text-ink-500">
                  {loading ? (
                    <span className="inline-block w-24 h-4 rounded bg-ink-100 animate-pulse" />
                  ) : (
                    <>
                      <span className="font-semibold text-ink-900">
                        {displayed.length.toLocaleString()}
                      </span>{' '}
                      {displayed.length === 1 ? 'course' : 'courses'}
                      {activeSub && (
                        <> matching <span className="text-[#26215C] font-semibold">{activeSub}</span></>
                      )}
                    </>
                  )}
                </p>
              </div>

              {/* Sort */}
              <select
                value={activeSort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="select w-auto text-sm"
                aria-label="Sort courses"
              >
                <option value="popular">Most Popular</option>
                <option value="rated">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="card p-14 text-center">
                <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
                <p className="text-sm font-semibold text-ink-700">No courses found</p>
                <p className="text-xs text-ink-400 mt-1">
                  Try adjusting your filters.
                </p>
                <button onClick={clearAll} className="btn-primary mt-4 inline-flex">
                  Clear filters
                </button>
              </div>
            ) : (
              /* 2-col mobile → 3-col tablet → 4-col desktop */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {displayed.map((course, i) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    priority={i < 4}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

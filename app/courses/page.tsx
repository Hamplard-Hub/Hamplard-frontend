'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { FilterSidebar } from '@/components/courses/FilterSidebar';
import { cn } from '@/lib/utils';
import type { Course, Category } from '@/types';

// ── Constants ─────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Most Relevant',  value: 'relevant'  },
  { label: 'Highest Rated',  value: 'rated'     },
  { label: 'Most Popular',   value: 'popular'   },
  { label: 'Newest',         value: 'newest'    },
] as const;

const PAGE_SIZE = 12;

// ── Skeleton card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-video bg-ink-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 rounded-lg bg-ink-100" />
        <div className="h-4 w-full rounded-lg bg-ink-100" />
        <div className="h-3 w-3/4 rounded-lg bg-ink-100" />
        <div className="h-3 w-24 rounded-lg bg-ink-100 mt-3" />
      </div>
    </div>
  );
}

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

// ── Pagination ────────────────────────────────────────────────────
function Pagination({
  page, totalPages, onChange,
}: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3)       return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="btn-secondary p-2 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'w-9 h-9 rounded-xl text-sm font-medium transition-all',
            p === page
              ? 'bg-saffron-500 text-white shadow-sm'
              : 'text-ink-600 hover:bg-ink-50',
          )}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="btn-secondary p-2 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function CourseBrowsePage() {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL
  const urlCategory = searchParams.get('category') ?? '';
  const urlLevel    = searchParams.get('level')    ?? '';
  const urlPrice    = searchParams.get('price')    ?? '';
  const urlSort     = searchParams.get('sort')     ?? 'relevant';
  const urlPage     = parseInt(searchParams.get('page') ?? '1', 10);
  const urlSearch   = searchParams.get('search')   ?? '';

  const [courses,    setCourses]    = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Push filter changes to URL without full reload
  const pushParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) { params.set(k, v); }
      else   { params.delete(k); }
    });
    // Reset to page 1 on filter change (unless explicitly setting page)
    if (!('page' in updates)) params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch categories once
  useEffect(() => {
    coursesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Fetch courses when URL params change
  useEffect(() => {
    setLoading(true);
    coursesApi.list({
      search:   urlSearch   || undefined,
      category: urlCategory || undefined,
      level:    urlLevel    || undefined,
      page:     urlPage,
      limit:    PAGE_SIZE,
    })
      .then(res => {
        // Client-side sort (API doesn't support sort param yet)
        let sorted = [...res.data];
        if (urlSort === 'popular') {
          sorted.sort((a, b) => (b.totalEnrollments ?? 0) - (a.totalEnrollments ?? 0));
        } else if (urlSort === 'newest') {
          sorted.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        } else if (urlSort === 'rated') {
          // No rating field in type yet — keep original order as fallback
        }

        // Client-side price filter
        if (urlPrice) {
          sorted = sorted.filter(c => {
            const p = Number(c.price);
            if (urlPrice === 'free')    return p === 0;
            if (urlPrice === 'under20') return p > 0 && p < 20;
            if (urlPrice === '20to50')  return p >= 20 && p <= 50;
            if (urlPrice === 'over50')  return p > 50;
            return true;
          });
        }

        setCourses(sorted);
        setTotal(res.meta?.total ?? sorted.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [urlSearch, urlCategory, urlLevel, urlSort, urlPrice, urlPage]);

  const totalPages   = Math.ceil(total / PAGE_SIZE);
  const activeChips: { label: string; clear: () => void }[] = [];

  if (urlSearch)   activeChips.push({ label: `"${urlSearch}"`,    clear: () => pushParams({ search: '' }) });
  if (urlCategory) activeChips.push({ label: urlCategory,         clear: () => pushParams({ category: '' }) });
  if (urlLevel)    activeChips.push({ label: urlLevel,            clear: () => pushParams({ level: '' }) });
  if (urlPrice) {
    const priceLabel = { free: 'Free', under20: 'Under $20', '20to50': '$20–$50', over50: 'Over $50' }[urlPrice] ?? urlPrice;
    activeChips.push({ label: priceLabel, clear: () => pushParams({ price: '' }) });
  }

  const clearAll = () => pushParams({ search: '', category: '', level: '', price: '', sort: '', page: '1' });

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
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              pushParams({ search: fd.get('q') as string ?? '' });
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
            onCategory={v => pushParams({ category: v })}
            onLevel={v    => pushParams({ level: v })}
            onPrice={v    => pushParams({ price: v })}
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
                    <><span className="font-semibold text-ink-900">{total.toLocaleString()}</span> results</>
                  )}
                </p>
              </div>

              {/* Sort dropdown */}
              <select
                value={urlSort}
                onChange={e => pushParams({ sort: e.target.value })}
                className="select w-auto text-sm"
                aria-label="Sort courses"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeChips.map(chip => (
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

            {/* Course grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
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
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={urlPage}
              totalPages={totalPages}
              onChange={p => pushParams({ page: String(p) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
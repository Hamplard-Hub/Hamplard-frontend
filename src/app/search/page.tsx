import type { Metadata } from 'next';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { FilterDrawer } from '@/components/search/FilterDrawer';
import { ActiveFilterChips } from '@/components/search/ActiveFilterChips';
import { EmptyResults } from '@/components/search/EmptyResults';
import {
  FilterSidebarSkeleton,
  ResultsCountSkeleton,
  ResultsGridSkeleton,
} from '@/components/search/SearchResultsLoadingState';
import { CourseCard } from '@/components/courses/CourseCard';
import { Pagination } from '@/components/ui/Pagination';
import { buildPaginatedMetadata } from '@/lib/seo';
import {
  useSearchStore,
  durationToBucket,
  DEFAULT_PRICE_RANGE,
} from '@/lib/hooks/use-search-store';
import type { Course } from '@/types';

type PageProps = {
  searchParams: { page?: string; q?: string };
};

/**
 * Generate SEO metadata for the search page with pagination support.
 * - Canonical URL always points to page 1 (no page parameter)
 * - rel="prev" and rel="next" links for pagination SEO
 * - All URLs are absolute including domain
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const pageParam = searchParams.page;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const query = searchParams.q || '';

  // Estimate total pages for search results
  const totalPages = 20;

  const title = query ? `Search: ${query}` : 'Search Courses';
  const description = query
    ? `Search results for "${query}". Find courses across tailoring, baking, photography, and more.`
    : 'Search for courses across all categories. Learn practical skills from expert instructors.';

  return buildPaginatedMetadata({
    title,
    description,
    basePath: '/search',
    currentPage,
    totalPages,
  });
}

'use client';

// Mock courses data — in production, fetch from API
const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    instructorAddress: 'GAJU...',
    title: 'Professional Tailoring Masterclass',
    description: 'Learn professional tailoring techniques and create stunning garments',
    category: 'Tailoring',
    level: 'Intermediate',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 4999,
    platformFeePercent: 10,
    status: 'ACTIVE',
    totalLessons: 24,
    totalDuration: 1440,
    totalEnrollments: 156,
    totalRevenue: 779844,
    txHash: null,
    approvedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-06-20T15:30:00Z',
    instructor: {
      name: 'Amara Okafor',
      stellarAddress: 'GAJU...',
      avatarUrl: null,
    },
    modules: [],
    _count: { enrollments: 156 },
    rating: 4.8,
    reviewCount: 42,
    badge: 'bestseller',
  },
  {
    id: 'course-2',
    instructorAddress: 'GBXY...',
    title: 'Artisan Baking: From Basics to Pastries',
    description: 'Master the art of baking with professional techniques',
    category: 'Baking',
    level: 'Beginner',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 3499,
    platformFeePercent: 10,
    status: 'ACTIVE',
    totalLessons: 18,
    totalDuration: 1080,
    totalEnrollments: 234,
    totalRevenue: 818166,
    txHash: null,
    approvedAt: '2024-02-01T10:00:00Z',
    createdAt: '2024-01-25T08:00:00Z',
    updatedAt: '2024-06-18T12:00:00Z',
    instructor: {
      name: 'Chioma Adeyemi',
      stellarAddress: 'GBXY...',
      avatarUrl: null,
    },
    modules: [],
    _count: { enrollments: 234 },
    rating: 4.9,
    reviewCount: 67,
    badge: 'new',
  },
  {
    id: 'course-3',
    instructorAddress: 'GCZK...',
    title: 'Professional Photography: Capturing Light',
    description: 'Learn composition, lighting, and editing techniques',
    category: 'Photography',
    level: 'Intermediate',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 5999,
    platformFeePercent: 10,
    status: 'ACTIVE',
    totalLessons: 30,
    totalDuration: 1800,
    totalEnrollments: 89,
    totalRevenue: 533911,
    txHash: null,
    approvedAt: '2024-03-05T10:00:00Z',
    createdAt: '2024-02-28T08:00:00Z',
    updatedAt: '2024-06-25T14:20:00Z',
    instructor: {
      name: 'Kwame Mensah',
      stellarAddress: 'GCZK...',
      avatarUrl: null,
    },
    modules: [],
    _count: { enrollments: 89 },
    rating: 4.7,
    reviewCount: 31,
  },
  {
    id: 'course-4',
    instructorAddress: 'GDXM...',
    title: 'Makeup Artistry: Bridal & Event Makeup',
    description: 'Specialized makeup techniques for weddings and events',
    category: 'Makeup Artistry',
    level: 'Intermediate',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 4499,
    platformFeePercent: 10,
    status: 'ACTIVE',
    totalLessons: 20,
    totalDuration: 1200,
    totalEnrollments: 178,
    totalRevenue: 801422,
    txHash: null,
    approvedAt: '2024-02-15T10:00:00Z',
    createdAt: '2024-02-08T08:00:00Z',
    updatedAt: '2024-06-22T11:45:00Z',
    instructor: {
      name: 'Zainab Hassan',
      stellarAddress: 'GDXM...',
      avatarUrl: null,
    },
    modules: [],
    _count: { enrollments: 178 },
    rating: 4.9,
    reviewCount: 54,
    badge: 'hot',
  },
  {
    id: 'course-5',
    instructorAddress: 'GEYN...',
    title: 'Modern Hairstyling & Hair Care',
    description: 'Contemporary hairstyles and professional hair care techniques',
    category: 'Hairstyling',
    level: 'Beginner',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 3999,
    platformFeePercent: 10,
    status: 'ACTIVE',
    totalLessons: 16,
    totalDuration: 960,
    totalEnrollments: 267,
    totalRevenue: 1067733,
    txHash: null,
    approvedAt: '2024-01-20T10:00:00Z',
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-06-23T09:15:00Z',
    instructor: {
      name: 'Ola Williams',
      stellarAddress: 'GEYN...',
      avatarUrl: null,
    },
    modules: [],
    _count: { enrollments: 267 },
    rating: 4.8,
    reviewCount: 75,
  },
];

const CATEGORIES = Array.from(new Set(MOCK_COURSES.map((c) => c.category)));

function SearchPageFallback() {
  return (
    <div className="min-h-screen bg-ink-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-ink-100" />
        <div className="h-12 w-full rounded-xl bg-ink-100" />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="h-64 rounded-xl bg-ink-100" />
          <div className="space-y-4">
            <div className="h-10 w-40 rounded bg-ink-100" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 rounded-xl bg-ink-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const {
    query,
    setQuery,
    sortBy,
    selectedCategories,
    toggleCategory,
    selectedLevels,
    selectedDurations,
    priceRange,
    minRating,
    clearFilters,
    activeFilterCount,
  } = useSearchStore();

  const filterCount = activeFilterCount();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize search from URL params
  useEffect(() => {
    if (initialQuery) {
      useSearchStore.setState({ query: initialQuery });
    }
    if (initialCategory && !selectedCategories.includes(initialCategory)) {
      toggleCategory(initialCategory);
    }
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    setIsLoading(true);

    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [query, selectedCategories, selectedLevels, selectedDurations, priceRange, minRating, sortBy, currentPage]);

  // Reset to the first page whenever the effective result set changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategories, selectedLevels, selectedDurations, priceRange, minRating, sortBy]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    // Copy so the in-place sort below never mutates the source array.
    let results = [...MOCK_COURSES];

    // Filter by search query
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (course) =>
          course.title.toLowerCase().includes(queryLower) ||
          course.description?.toLowerCase().includes(queryLower) ||
          course.instructor?.name?.toLowerCase().includes(queryLower),
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      results = results.filter((course) => selectedCategories.includes(course.category));
    }

    // Filter by level
    if (selectedLevels.length > 0) {
      results = results.filter((course) => selectedLevels.includes(course.level));
    }

    // Filter by duration bucket
    if (selectedDurations.length > 0) {
      results = results.filter((course) =>
        selectedDurations.includes(durationToBucket(course.totalDuration)),
      );
    }

    // Filter by price range
    if (priceRange.min !== DEFAULT_PRICE_RANGE.min || priceRange.max !== DEFAULT_PRICE_RANGE.max) {
      results = results.filter((course) => {
        if (course.price < priceRange.min) return false;
        if (priceRange.max !== null && course.price > priceRange.max) return false;
        return true;
      });
    }

    // Filter by minimum rating
    if (minRating > 0) {
      results = results.filter((course) => (course.rating || 0) >= minRating);
    }

    // Sort results
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        results.sort(
          (a, b) => (b._count?.enrollments || 0) - (a._count?.enrollments || 0),
        );
        break;
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'relevance':
      default:
        // Keep original order or implement scoring
        break;
    }

    return results;
  }, [query, selectedCategories, selectedLevels, selectedDurations, priceRange, minRating, sortBy]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Terms fed to the "Did you mean…" spelling suggestion.
  const suggestionDictionary = useMemo(() => {
    const terms = new Set<string>();
    MOCK_COURSES.forEach((course) => {
      terms.add(course.category);
      if (course.instructor?.name) terms.add(course.instructor.name);
    });
    return Array.from(terms);
  }, []);

  const hasActiveFilters = filterCount > 0 || Boolean(query);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Search Courses</h1>
              <p className="text-sm text-ink-500 mt-1">
                {isLoading ? <ResultsCountSkeleton /> : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <SearchBar courses={MOCK_COURSES} showSuggestions />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Filters (desktop) */}
          <aside className="hidden lg:col-span-1 lg:block">
            <div className="sticky top-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-hamplard-mid hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {isLoading ? (
                <FilterSidebarSkeleton />
              ) : (
                <FilterPanel courses={MOCK_COURSES} />
              )}
            </div>
          </aside>

          {/* Mobile filter drawer */}
          <FilterDrawer
            open={showFilters}
            onClose={() => setShowFilters(false)}
            courses={MOCK_COURSES}
            resultCount={filteredCourses.length}
          />

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Mobile Filter Toggle */}
            <div className="mb-6 lg:hidden">
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-hamplard-lilac px-4 py-2 text-sm font-medium text-hamplard-deep transition-colors hover:bg-saffron-100"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Show Filters
                {filterCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-hamplard-primary px-1.5 text-xs font-semibold text-white">
                    {filterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active filter chips */}
            {!isLoading && <ActiveFilterChips />}

            {/* Results */}
            {isLoading ? (
              <ResultsGridSkeleton />
            ) : paginatedCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  {paginatedCourses.map((course, index) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      priority={index < 3}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="py-8 border-t border-ink-100"
                  />
                )}
              </>
            ) : (
              <EmptyResults
                query={query}
                suggestionDictionary={suggestionDictionary}
                suggestedCategories={CATEGORIES}
                hasActiveFilters={hasActiveFilters}
                onSuggestionSelect={(term) => setQuery(term)}
                onClearFilters={clearFilters}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

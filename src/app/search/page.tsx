'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/Button';
import { useSearchStore } from '@/lib/hooks/use-search-store';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { query, sortBy, setSortBy, selectedCategories, toggleCategory, clearFilters } =
    useSearchStore();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize search from URL params
  useEffect(() => {
    if (initialQuery) {
      useSearchStore.setState({ query: initialQuery });
    }
    if (initialCategory && !selectedCategories.includes(initialCategory)) {
      toggleCategory(initialCategory);
    }
  }, [initialQuery, initialCategory]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let results = MOCK_COURSES;

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

    // Sort results
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
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
  }, [query, selectedCategories, sortBy]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Search Courses</h1>
              <p className="text-sm text-ink-500 mt-1">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
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
          {/* Sidebar Filters */}
          <aside
            className={cn(
              'lg:col-span-1',
              !showFilters && 'hidden lg:block',
            )}
          >
            <div className="sticky top-4 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h2 className="text-lg font-semibold text-ink-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-ink-500 hover:text-ink-900"
                >
                  ✕
                </button>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-semibold text-ink-900 block mb-3">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as any)
                    }
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-hamplard-primary appearance-none cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-semibold text-ink-900 block mb-3">
                  Categories
                </label>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer hover:text-hamplard-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 accent-hamplard-primary rounded cursor-pointer"
                      />
                      <span className="text-sm text-ink-700">{category}</span>
                      <span className="text-xs text-ink-400 ml-auto">
                        {MOCK_COURSES.filter((c) => c.category === category).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(query || selectedCategories.length > 0) && (
                <Button
                  variant="tertiary"
                  size="md"
                  fullWidth
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Mobile Filter Toggle */}
            <div className="mb-6 lg:hidden">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setShowFilters(true)}
                icon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Show Filters
              </Button>
            </div>

            {/* Results */}
            {paginatedCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  {paginatedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-8 border-t border-ink-100">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-ink-200 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          page === currentPage
                            ? 'bg-hamplard-primary text-white'
                            : 'border border-ink-200 text-ink-700 hover:bg-ink-50',
                        )}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-ink-200 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Search className="w-12 h-12 text-ink-200 mb-4" />
                <h3 className="text-lg font-semibold text-ink-900 mb-2">No courses found</h3>
                <p className="text-center text-sm text-ink-500 max-w-sm">
                  {query
                    ? `No results for "${query}". Try different keywords or clear your filters.`
                    : 'Try searching for courses or selecting a category to get started.'}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-6"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

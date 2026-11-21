'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ShoppingCart } from '@/components/cart/ShoppingCart';
import { SearchBar } from '@/components/search/SearchBar';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { Heart, ShoppingCart as CartIcon } from 'lucide-react';
import type { Course } from '@/types';

const SAMPLE_COURSES: Course[] = [
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
  },
];

export default function ComponentsDemoPage() {
  const [showCart, setShowCart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getItemCount, addItem } = useCartStore();

  const cartCount = getItemCount();

  const handleAddToCart = (course: Course) => {
    addItem(course);
  };

  const handleLoadingDemo = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink-900">Component Library Demo</h1>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative p-2 hover:bg-ink-50 rounded-lg transition-colors"
          >
            <CartIcon className="w-6 h-6 text-hamplard-primary" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Button Component Demo */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-4">Button Component</h2>
              <div className="space-y-6">
                {/* Variants */}
                <div>
                  <p className="text-sm font-semibold text-ink-600 mb-3">Variants</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="tertiary">Tertiary Button</Button>
                    <Button variant="danger">Danger Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <p className="text-sm font-semibold text-ink-600 mb-3">Sizes</p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                {/* With Icons */}
                <div>
                  <p className="text-sm font-semibold text-ink-600 mb-3">With Icons</p>
                  <div className="flex flex-wrap gap-3">
                    <Button icon={<Heart className="w-4 h-4" />}>With Left Icon</Button>
                    <Button icon={<CartIcon className="w-4 h-4" />} iconPosition="right">
                      With Right Icon
                    </Button>
                  </div>
                </div>

                {/* States */}
                <div>
                  <p className="text-sm font-semibold text-ink-600 mb-3">States</p>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled Button</Button>
                    <Button isLoading loadingText="Processing">
                      Loading Button
                    </Button>
                    <Button onClick={handleLoadingDemo} isLoading={isLoading}>
                      {isLoading ? 'Click to demo...' : 'Click for Loading Demo'}
                    </Button>
                  </div>
                </div>

                {/* Full Width */}
                <div>
                  <p className="text-sm font-semibold text-ink-600 mb-3">Full Width</p>
                  <Button fullWidth>Full Width Button</Button>
                </div>
              </div>
            </section>

            {/* Search Bar Demo */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-4">Search Bar Component</h2>
              <div className="space-y-4">
                <p className="text-sm text-ink-500">
                  Try typing to see autocomplete suggestions. Press Enter or click a suggestion to search.
                </p>
                <SearchBar courses={SAMPLE_COURSES} showSuggestions />
              </div>
            </section>

            {/* Course Selection Demo */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-4">Add Courses to Cart</h2>
              <div className="space-y-3">
                {SAMPLE_COURSES.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border border-ink-100 rounded-lg hover:bg-ink-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-ink-900">{course.title}</h3>
                      <p className="text-sm text-ink-500">
                        {course.instructor?.name || 'Hamplard Instructor'} • ${course.price}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAddToCart(course)}
                      icon={<CartIcon className="w-4 h-4" />}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Shopping Cart Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-lg shadow-sm border border-ink-100 overflow-hidden h-[600px]">
              <ShoppingCart isOpen onClose={() => setShowCart(false)} />
            </div>
          </aside>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 mt-8 border-t border-ink-100">
        <section className="bg-white rounded-lg p-6 shadow-sm border border-ink-100">
          <h2 className="text-xl font-bold text-ink-900 mb-4">Component Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Button Docs */}
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">Button Component</h3>
              <p className="text-sm text-ink-600 mb-2">
                Location: <code className="bg-ink-50 px-2 py-1 rounded text-xs">src/components/ui/Button.tsx</code>
              </p>
              <div className="text-sm text-ink-600 space-y-1">
                <p><strong>Props:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-ink-500">
                  <li>variant: primary | secondary | tertiary | danger | ghost</li>
                  <li>size: sm | md | lg</li>
                  <li>isLoading: boolean</li>
                  <li>loadingText: string</li>
                  <li>icon: ReactNode</li>
                  <li>iconPosition: left | right</li>
                  <li>fullWidth: boolean</li>
                </ul>
              </div>
            </div>

            {/* SearchBar Docs */}
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">Search Bar Component</h3>
              <p className="text-sm text-ink-600 mb-2">
                Location: <code className="bg-ink-50 px-2 py-1 rounded text-xs">src/components/search/SearchBar.tsx</code>
              </p>
              <div className="text-sm text-ink-600 space-y-1">
                <p><strong>Props:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-ink-500">
                  <li>onSearch: (query: string) =&gt; void</li>
                  <li>placeholder: string</li>
                  <li>showSuggestions: boolean</li>
                  <li>courses: Course[]</li>
                  <li>isLoading: boolean</li>
                </ul>
              </div>
            </div>

            {/* ShoppingCart Docs */}
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">Shopping Cart Component</h3>
              <p className="text-sm text-ink-600 mb-2">
                Location: <code className="bg-ink-50 px-2 py-1 rounded text-xs">src/components/cart/ShoppingCart.tsx</code>
              </p>
              <div className="text-sm text-ink-600 space-y-1">
                <p><strong>Props:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-ink-500">
                  <li>isOpen: boolean</li>
                  <li>onClose: () =&gt; void</li>
                </ul>
                <p className="mt-2"><strong>State:</strong> useCartStore</p>
              </div>
            </div>

            {/* Search Results Docs */}
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">Search Results Page</h3>
              <p className="text-sm text-ink-600 mb-2">
                Location: <code className="bg-ink-50 px-2 py-1 rounded text-xs">src/app/search/page.tsx</code>
              </p>
              <div className="text-sm text-ink-600 space-y-1">
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-ink-500">
                  <li>URL-based filtering</li>
                  <li>Category filtering</li>
                  <li>Sorting (rating, price, newest)</li>
                  <li>Pagination</li>
                  <li>Responsive design</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

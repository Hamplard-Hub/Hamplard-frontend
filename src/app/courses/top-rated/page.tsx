import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TopRatedCoursesContent } from './TopRatedCoursesContent';

export const metadata: Metadata = {
  title: 'Top Rated Courses on Hamplard | 4.5+ Star Learning Excellence',
  description: 'Explore the highest-rated courses on Hamplard with 4.5+ star ratings. Learn from expert instructors across Africa in tailoring, baking, photography, makeup artistry, hairstyling, and more. Start your learning journey today.',
  openGraph: {
    title: 'Top Rated Courses on Hamplard',
    description: 'Discover the best courses with 4.5+ star ratings from expert instructors across Africa and beyond.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Rated Courses on Hamplard',
    description: 'Explore the highest-rated courses with 4.5+ star ratings on Hamplard.',
  },
};

export default function TopRatedCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink-50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-10 w-64 rounded bg-ink-100" />
            <div className="h-6 w-96 rounded bg-ink-100" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-64 rounded-xl bg-ink-100" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <TopRatedCoursesContent />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildPaginatedMetadata } from '@/lib/seo';
import { CourseBrowseClient } from './CourseBrowseClient';

type PageProps = {
  searchParams: { page?: string };
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  return buildPaginatedMetadata({
    title: 'Browse Courses',
    description:
      'Discover skills from expert instructors across Africa and beyond. Learn tailoring, makeup, baking, photography, hairstyling, and more.',
    basePath: '/courses',
    currentPage,
    totalPages: 50,
  });
}

export default function CoursesPage() {
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
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-56 rounded-xl bg-ink-100" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CourseBrowseClient />
    </Suspense>
  );
}

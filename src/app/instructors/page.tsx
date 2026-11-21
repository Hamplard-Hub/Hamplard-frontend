import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo';
import { InstructorsClient } from './InstructorsClient';

export const metadata: Metadata = buildMetadata({
  title: 'Instructors',
  description:
    'Browse the instructors teaching on Hamplard — master tailors, makeup artists, pastry chefs, photographers and more. Find the right teacher for the skill you want to learn.',
  path: '/instructors',
});

export default function InstructorsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink-50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-ink-100" />
            <div className="h-12 w-full max-w-lg rounded-xl bg-ink-100" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-28 rounded-full bg-ink-100" />
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-ink-100" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <InstructorsClient />
    </Suspense>
  );
}

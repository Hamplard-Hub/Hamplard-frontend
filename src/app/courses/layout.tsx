import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

// /courses is a client component; its metadata is declared here. Nested segments
// (/courses/[id]) override this with their own generateMetadata.
export const metadata: Metadata = buildMetadata({
  title: 'Browse Courses',
  description:
    'Browse practical, job-ready courses in tailoring, makeup, baking, photography and more. Filter by category, level and price.',
  path: '/courses',
});

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

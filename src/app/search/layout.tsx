import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

// Results depend on the `q` parameter, so the page is left out of the sitemap and
// noindexed to avoid thin, near-duplicate URLs — links out of it are still followed.
export const metadata: Metadata = buildMetadata({
  title: 'Search Courses',
  description: 'Search Hamplard for courses by title, category, instructor or skill.',
  path: '/search',
  noIndex: true,
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

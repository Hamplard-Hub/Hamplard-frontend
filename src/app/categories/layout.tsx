import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Course Categories',
  description:
    'Explore vocational skill categories on Hamplard — tailoring, pastry arts, makeup artistry, photography, leatherwork, and more.',
  path: '/categories',
});

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

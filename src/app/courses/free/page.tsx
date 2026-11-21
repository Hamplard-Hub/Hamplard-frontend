import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { FreeCoursesClient } from './FreeCoursesClient';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Free Courses',
    description:
      'Explore free practical courses on Hamplard and start learning without spending.',
    path: '/courses/free',
  });
}

export default function FreeCoursesPage() {
  return <FreeCoursesClient />;
}
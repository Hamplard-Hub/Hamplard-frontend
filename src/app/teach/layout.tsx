import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Teach on Hamplard',
  description:
    'Share your vocational expertise with learners across Africa and earn revenue teaching practical skills on Hamplard.',
  path: '/teach',
});

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

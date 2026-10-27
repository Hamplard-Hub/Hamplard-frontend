import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

// Course comparison state is user-selected and ephemeral; prevent search engine indexing and link following.
export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Compare Courses',
    description:
      'Compare Hamplard vocational courses side by side across price, curriculum, duration, level, and learner ratings.',
    path: '/compare',
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Hamplard for Teams',
  description:
    'Upskill your workforce with curated vocational training, team analytics, and verified completion certificates on Hamplard.',
  path: '/teams',
});

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Learner Leaderboard',
  description:
    'See top learners on Hamplard ranked by completed lessons, streaks, and earned vocational certificates.',
  path: '/leaderboard',
});

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

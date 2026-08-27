import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Notifications',
  description: 'Your Hamplard notifications.',
  path: '/notifications',
  noIndex: true,
});

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

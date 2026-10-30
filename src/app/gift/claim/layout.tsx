import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Claim Gift',
  description: 'Redeem your gifted Hamplard course.',
  path: '/gift/claim',
  noIndex: true,
});

export default function GiftClaimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

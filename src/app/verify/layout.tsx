import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Verify Email',
  description: 'Verify your email address to activate your Hamplard learner account.',
  path: '/verify',
  noIndex: true,
});

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

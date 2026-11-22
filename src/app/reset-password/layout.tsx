import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Reset Password',
  description: 'Reset your Hamplard account password.',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Log In',
  description: 'Log in to Hamplard to continue your courses, track progress and claim certificates.',
  path: '/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

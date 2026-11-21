import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Create an Account',
  description:
    'Create a free Hamplard account and start learning practical, job-ready skills from expert instructors.',
  path: '/signup',
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

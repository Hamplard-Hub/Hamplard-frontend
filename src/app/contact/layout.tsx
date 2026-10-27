import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with the Hamplard support and partnerships team for learner assistance, instructor onboarding, or enterprise inquiries.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

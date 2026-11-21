import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

// Publicly reachable so a certificate link can be verified by anyone, but each URL
// carries an individual learner's record, so it is kept out of search results.
export const metadata: Metadata = buildMetadata({
  title: 'Verify Certificate',
  description: 'Verify the authenticity of a Hamplard certificate of completion.',
  path: '/certificates',
  noIndex: true,
});

export default function CertificateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

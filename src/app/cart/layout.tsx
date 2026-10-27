import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

// Cart contents are per-user/session state and should never be indexed or followed by search crawlers.
export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Shopping Cart',
    description:
      'Review your selected vocational courses, apply promo codes, and proceed to checkout on Hamplard.',
    path: '/cart',
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

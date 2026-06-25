import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: { default: 'Hamplard', template: '%s | Hamplard' },
  description: 'Learn practical skills — tailoring, makeup, baking, photography and more. Africa\'s online vocational skills platform.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Footer } from '@/components/layout/Footer';
import { siteConfig, siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Hamplard', template: '%s | Hamplard' },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'online courses',
    'vocational skills',
    'learn tailoring',
    'makeup classes',
    'baking course',
    'photography course',
    'Africa e-learning',
    'Hamplard',
  ],
  description: 'Learn practical skills — tailoring, makeup, baking, photography and more. Africa\'s online vocational skills platform.',
  metadataBase: new URL('https://hamplard.app'),
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    ...(siteConfig.twitterHandle ? { site: siteConfig.twitterHandle } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body>
        {/* Skip navigation — first focusable element for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-hamplard-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <Providers>
          <div id="main-content" tabIndex={-1} className="outline-none">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

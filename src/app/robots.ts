import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/courses', '/categories', '/teach', '/about'],
        disallow: ['/dashboard', '/checkout', '/api', '/auth'],
      },
    ],
    sitemap: [absoluteUrl('/sitemap.xml')],
    host: siteUrl,
  };
}

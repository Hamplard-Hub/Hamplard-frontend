import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl, DISALLOWED_PATHS } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/courses', '/categories', '/teach', '/about'],
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: [absoluteUrl('/sitemap.xml')],
    host: siteUrl,
  };
}

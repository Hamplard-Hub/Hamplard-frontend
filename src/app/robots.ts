import type { MetadataRoute } from 'next';
import { absoluteUrl, DISALLOWED_PATHS, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated areas, internal demos and the API surface. Disallow is a
        // prefix match, so `/dashboard` covers the segment and everything under it.
        // The same list drives the segment-level noindex tags (see @/lib/seo).
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl,
  };
}

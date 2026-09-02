import type { Metadata } from 'next';

/**
 * Public origin the site is served from. Every canonical/OG URL is built from this,
 * so set NEXT_PUBLIC_SITE_URL per environment (preview deploys, staging) to stop
 * canonicals from pointing at production.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hamplard.com').replace(/\/+$/, '');

export const siteConfig = {
  name: 'Hamplard',
  url: siteUrl,
  description:
    'Learn practical skills — tailoring, makeup, baking, photography and more. Africa\'s online vocational skills platform.',
  /** Optional; `twitter:site` is only emitted when the handle is configured. */
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
};

/** Routes crawlers must never index. Shared by robots.ts and the sitemap. */
export const DISALLOWED_PATHS = [
  '/dashboard',
  '/notifications',
  '/auth',
  '/components-demo',
  '/api',
];

/** Static public routes, in sitemap priority order. */
export const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}> = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/courses', changeFrequency: 'daily', priority: 0.9 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/signup', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/help', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/login', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  ];

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

type PageSeo = {
  /** Page-level title; the root layout appends " | Hamplard". */
  title?: string;
  description?: string;
  /** Path this page is canonically served from, e.g. `/courses`. */
  path: string;
  images?: string[];
  type?: 'website' | 'article';
  /** Emits `noindex, follow`: keep the page out of results but still crawl its links. */
  noIndex?: boolean;
};

/**
 * Builds the per-page metadata block: canonical, Open Graph and Twitter Card.
 * Open Graph titles are spelled out in full because the `%s | Hamplard` template
 * only applies to the `<title>` tag, not to og:title / twitter:title.
 */
export function buildMetadata({
  title,
  description,
  path,
  images,
  type = 'website',
  noIndex = false,
}: PageSeo): Metadata {
  const url = absoluteUrl(path);
  const resolvedDescription = description ?? siteConfig.description;
  const socialTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;

  return {
    ...(title ? { title } : {}),
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: siteConfig.name,
      title: socialTitle,
      description: resolvedDescription,
      locale: 'en_US',
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: resolvedDescription,
      ...(siteConfig.twitterHandle ? { site: siteConfig.twitterHandle } : {}),
      ...(images ? { images } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Builds pagination-aware metadata for paginated listing pages.
 * Pages 2+ have their canonical pointing to page 1 to avoid duplicate content penalties.
 * Also includes rel="prev" and rel="next" link tags for SEO.
 */
export function buildPaginatedMetadata({
  title,
  description,
  basePath,
  currentPage,
  totalPages,
  images,
  type = 'website',
}: {
  title?: string;
  description?: string;
  /** Base path without page parameter, e.g. '/courses' */
  basePath: string;
  currentPage: number;
  totalPages: number;
  images?: string[];
  type?: 'website' | 'article';
}): Metadata {
  // Canonical always points to page 1 (no query param)
  const canonicalUrl = absoluteUrl(basePath);
  const resolvedDescription = description ?? siteConfig.description;
  const socialTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;

  // Build prev/next links
  const links: Array<{ rel: string; href: string }> = [];

  if (currentPage > 1) {
    const prevPage = currentPage - 1;
    const prevPath = prevPage === 1 ? basePath : `${basePath}?page=${prevPage}`;
    links.push({ rel: 'prev', href: absoluteUrl(prevPath) });
  }

  if (currentPage < totalPages) {
    const nextPath = `${basePath}?page=${currentPage + 1}`;
    links.push({ rel: 'next', href: absoluteUrl(nextPath) });
  }

  return {
    ...(title ? { title } : {}),
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type,
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: socialTitle,
      description: resolvedDescription,
      locale: 'en_US',
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: resolvedDescription,
      ...(siteConfig.twitterHandle ? { site: siteConfig.twitterHandle } : {}),
      ...(images ? { images } : {}),
    },
    // Add other links for prev/next
    ...(links.length > 0 ? { other: links } : {}),
  };
}

import type { MetadataRoute } from 'next';
import { getCategoriesForSitemap, getCoursesForSitemap } from '@/lib/api/server';
import { absoluteUrl, PUBLIC_ROUTES } from '@/lib/seo';

/** Regenerate the sitemap hourly rather than pinning it at build time. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Resolves to [] when the API is unreachable, so a backend outage degrades the
  // sitemap to its static routes instead of failing the request.
  const [categories, courses] = await Promise.all([
    getCategoriesForSitemap(),
    getCoursesForSitemap(),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/courses?category=${encodeURIComponent(category.name)}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: absoluteUrl(`/courses/${course.id}`),
    lastModified: course.updatedAt ? new Date(course.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...courseRoutes];
}

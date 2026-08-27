import type { Course } from '@/types';
import { absoluteUrl, siteConfig, siteUrl } from './seo';

/**
 * schema.org/Course payload for course detail pages.
 *
 * Only fields the API actually populates are emitted — Rich Results flags empty
 * or placeholder values, so optional properties are spread in conditionally.
 * `totalDuration` is stored in seconds (see `courseTotalMins` in CourseCard) and
 * is converted to an ISO 8601 duration for `courseWorkload`.
 */
export function buildCourseJsonLd(course: Course) {
  const url = absoluteUrl(`/courses/${course.id}`);
  const description = course.description?.trim() || `Learn ${course.title} on ${siteConfig.name}.`;
  const workloadMinutes = Math.round((course.totalDuration ?? 0) / 60);
  const instructorName = course.instructor?.name?.trim();
  const hasRating = typeof course.rating === 'number' && (course.reviewCount ?? 0) > 0;

  const instructor = instructorName
    ? { '@type': 'Person' as const, name: instructorName }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description,
    url,
    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
    ...(course.language ? { inLanguage: course.language } : { inLanguage: 'en' }),
    ...(course.level ? { educationalLevel: course.level } : {}),
    ...(course.category ? { about: course.category } : {}),
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteUrl,
    },
    ...(instructor ? { instructor } : {}),
    ...(hasRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: course.rating,
            reviewCount: course.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: [
      {
        '@type': 'Offer',
        url,
        // Prices are held in USDC and rendered as dollars (see formatUsdc), so the
        // ISO 4217 code Rich Results expects is USD.
        price: course.price ?? 0,
        priceCurrency: 'USD',
        category: (course.price ?? 0) > 0 ? 'Paid' : 'Free',
        availability: 'https://schema.org/InStock',
      },
    ],
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        ...(workloadMinutes > 0 ? { courseWorkload: `PT${workloadMinutes}M` } : {}),
        ...(instructor ? { instructor } : {}),
      },
    ],
  };
}

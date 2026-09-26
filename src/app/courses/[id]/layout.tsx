import type { Metadata } from 'next';
import { getCourseForMetadata } from '@/lib/api/server';
import { buildMetadata, siteConfig } from '@/lib/seo';
import { buildCourseJsonLd } from '@/lib/structured-data';

/**
 * The course detail page is a client component, so its per-course metadata and
 * JSON-LD live here in the server layout. Both this layout and generateMetadata
 * call the same fetch, which Next de-duplicates within a render pass.
 */
type CourseLayoutProps = {
  children: React.ReactNode;
  params: { id: string };
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const course = await getCourseForMetadata(params.id);

  if (!course) {
    return buildMetadata({
      title: 'Course',
      description: `Browse practical, job-ready courses on ${siteConfig.name}.`,
      path: `/courses/${params.id}`,
    });
  }

  const description =
    course.description?.trim().slice(0, 300) ||
    `Learn ${course.title} on ${siteConfig.name}. ${course.totalLessons ?? 0} lessons, taught by ${course.instructor?.name ?? 'an expert instructor'}.`;

  return buildMetadata({
    title: course.title,
    description,
    path: `/courses/${course.id}`,
    type: 'article',
    // og:image / twitter:image come from the sibling opengraph-image.tsx, which
    // takes precedence over metadata images and renders a card for every course
    // (thumbnailUrl is frequently null).
  });
}

export default async function CourseDetailLayout({ children, params }: CourseLayoutProps) {
  const course = await getCourseForMetadata(params.id);

  return (
    <>
      {course ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildCourseJsonLd(course)) }}
        />
      ) : null}
      {children}
    </>
  );
}

import { COURSE_OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderCourseOgImage } from '@/lib/og';

// See the root opengraph-image.tsx for why this runs on the edge runtime.
export const runtime = 'edge';

export const alt = COURSE_OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function CourseOpengraphImage({ params }: { params: { id: string } }) {
  return renderCourseOgImage(params.id);
}

import { COURSE_OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderCourseOgImage } from '@/lib/og';

export const runtime = 'edge';

export const alt = COURSE_OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function CourseTwitterImage({ params }: { params: { id: string } }) {
  return renderCourseOgImage(params.id);
}

import type { Category, Course, InstructorProfile, Review } from '@/types';
import { aggregateInstructor, instructorKey } from '@/lib/instructors';

/**
 * Server-side reads used by `generateMetadata` and the sitemap.
 *
 * The browser client in `./client.ts` is axios-based and attaches a localStorage
 * token, neither of which works during SSR. These helpers use plain `fetch` so
 * Next can cache and de-duplicate them across a render pass, and they resolve to
 * null/[] on any failure — metadata must never be the reason a page 500s.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/** Revalidate window for SEO reads, in seconds. */
const REVALIDATE = 3600;

export async function getCourseForMetadata(id: string): Promise<Course | null> {
  try {
    const res = await fetch(`${API_URL}/courses/${encodeURIComponent(id)}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data as Course) ?? null;
  } catch {
    return null;
  }
}

/** Published courses for the sitemap. Paginated payloads are `data.data` + `data.meta`. */
export async function getCoursesForSitemap(limit = 200): Promise<Course[]> {
  try {
    const courses: Course[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await fetch(`${API_URL}/courses?page=${page}&limit=${limit}`, {
        next: { revalidate: REVALIDATE },
      });
      if (!res.ok) return courses;

      const body = await res.json();
      const pageData = body?.data;
      if (!Array.isArray(pageData?.data)) return courses;

      courses.push(...(pageData.data as Course[]));
      totalPages = Number(pageData.meta?.totalPages) || page;
      page += 1;
    }

    return Array.from(new Map(courses.map((course) => [course.id, course])).values());
  } catch {
    return [];
  }
}

/** Public course categories used to build crawlable filtered course pages. */
export async function getCategoriesForSitemap(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/courses/categories`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return [];

    const body = await res.json();
    return Array.isArray(body?.data) ? (body.data as Category[]) : [];
  } catch {
    return [];
  }
}

/**
 * Reviews for a set of courses, tolerating individual failures.
 *
 * Only the first ten courses are queried — an instructor with a long catalogue
 * would otherwise fire dozens of requests on every page view.
 */
async function getReviewsForCourses(courseIds: string[]): Promise<Review[]> {
  const lists = await Promise.all(
    courseIds.slice(0, 10).map(async (courseId) => {
      try {
        const res = await fetch(
          `${API_URL}/courses/${encodeURIComponent(courseId)}/reviews`,
          { next: { revalidate: REVALIDATE } },
        );
        if (!res.ok) return [] as Review[];

        const body = await res.json();
        return Array.isArray(body?.data) ? (body.data as Review[]) : [];
      } catch {
        return [] as Review[];
      }
    }),
  );

  return lists
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Loads an instructor profile for `generateMetadata` and the JSON-LD block.
 *
 * The public instructors endpoint is optional — when it is missing the profile
 * is derived from the courses the instructor teaches, mirroring the client
 * side fallback in `instructorsApi`.
 */
export async function getInstructorForMetadata(
  id: string,
): Promise<InstructorProfile | null> {
  if (!id?.trim()) return null;

  let profile: InstructorProfile | null = null;

  try {
    const res = await fetch(`${API_URL}/instructors/${encodeURIComponent(id)}`, {
      next: { revalidate: REVALIDATE },
    });
    if (res.ok) {
      const body = await res.json();
      const payload = body?.data as InstructorProfile | undefined;
      if (payload?.name) profile = payload;
    }
  } catch {
    // Fall through to the course-derived fallback below.
  }

  if (!profile) {
    profile = await deriveInstructorFromCourses(id);
  }

  if (!profile) return null;

  const courses = profile.courses ?? [];
  const reviews =
    profile.reviews && profile.reviews.length > 0
      ? profile.reviews
      : await getReviewsForCourses(courses.map((course) => course.id));

  return { ...profile, courses, reviews };
}

/** Builds an instructor profile from the courses they teach. */
async function deriveInstructorFromCourses(
  id: string,
): Promise<InstructorProfile | null> {
  try {
    const res = await fetch(`${API_URL}/courses?limit=100`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;

    const body = await res.json();
    const pageData = body?.data;
    const courses = (Array.isArray(pageData?.data) ? pageData.data : []) as Course[];
    if (courses.length === 0) return null;

    const own = courses.filter((course) => instructorKey(course) === id);
    if (own.length === 0) return null;

    return {
      ...aggregateInstructor(own),
      courses: own,
      reviews: [],
    };
  } catch {
    return null;
  }
}

import type { Course, Instructor, InstructorSort } from '@/types';

/**
 * Helpers for the public instructor surfaces (`/instructors` and
 * `/instructors/[id]`).
 *
 * The backend has no dedicated public instructors endpoint yet, so an
 * instructor profile is derived from the courses they teach. These helpers are
 * pure so both the client (browser) and the server (metadata, JSON-LD) can use
 * them without pulling the API client into a server bundle.
 */

/** Fallback display name when the API does not provide one. */
export const UNKNOWN_INSTRUCTOR_NAME = 'Hamplard Instructor';

/**
 * The identifier used in `/instructors/[id]`.
 *
 * Courses expose the instructor either as a nested object (with a user id) or
 * only as a wallet address, so the address is the fallback key.
 */
export function instructorKey(course: Course): string {
  return (
    course.instructor?.id?.trim() ||
    course.instructorAddress?.trim() ||
    course.instructor?.stellarAddress?.trim() ||
    ''
  );
}

/** The public profile path for an instructor. */
export function instructorPath(id: string): string {
  return `/instructors/${encodeURIComponent(id)}`;
}

/**
 * The profile path for the instructor of a course.
 *
 * Returns `null` when the course carries no usable identifier, so callers can
 * fall back to rendering plain text instead of a broken link.
 */
export function courseInstructorPath(course: Course): string | null {
  const key = instructorKey(course);
  return key ? instructorPath(key) : null;
}

/**
 * Builds an instructor profile from the courses they teach.
 *
 * Ratings are averaged across the instructor's courses, weighted by the number
 * of reviews behind each rating so a single five-star course with three
 * reviews cannot outrank a four-star course with five hundred.
 */
export function aggregateInstructor(courses: Course[]): Instructor {
  const first = courses[0];
  const instructor = first?.instructor;

  let ratingSum = 0;
  let ratingWeight = 0;
  let reviewCount = 0;
  let totalStudents = 0;

  for (const course of courses) {
    const courseRating = course.rating;
    const courseReviews = course.reviewCount ?? 0;

    if (typeof courseRating === 'number' && Number.isFinite(courseRating)) {
      ratingSum += courseRating * (courseReviews || 1);
      ratingWeight += courseReviews || 1;
    }

    reviewCount += courseReviews;
    totalStudents += course.totalEnrollments ?? course._count?.enrollments ?? 0;
  }

  const categories = Array.from(
    new Set(courses.map((course) => course.category?.trim()).filter(Boolean)),
  );

  const name = instructor?.name?.trim() || UNKNOWN_INSTRUCTOR_NAME;
  const category = categories[0] ?? null;

  return {
    id: instructorKey(first),
    name,
    avatarUrl: instructor?.avatarUrl ?? null,
    // There is no speciality field on the course payload, so the teaching
    // category doubles as the headline until the API exposes a real one.
    headline: category ? `${category} instructor` : null,
    bio: instructor?.bio?.trim() || null,
    location: null,
    website: null,
    twitter: null,
    linkedin: null,
    instagram: null,
    stellarAddress:
      instructor?.stellarAddress?.trim() || first?.instructorAddress?.trim() || null,
    category,
    rating: ratingWeight > 0 ? ratingSum / ratingWeight : 0,
    reviewCount,
    totalStudents,
    totalCourses: courses.length,
  };
}

/**
 * Groups courses by instructor and derives one profile per instructor.
 */
export function aggregateInstructors(courses: Course[]): Instructor[] {
  const groups = new Map<string, Course[]>();

  for (const course of courses) {
    const key = instructorKey(course);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(course);
    else groups.set(key, [course]);
  }

  return Array.from(groups.values()).map(aggregateInstructor);
}

/** Free-text search across the instructor's public fields. */
export function matchesInstructorSearch(instructor: Instructor, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return [
    instructor.name,
    instructor.headline,
    instructor.bio,
    instructor.category,
    instructor.location,
  ]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(needle));
}

/** Filters the directory by the free-text search and the category filter. */
export function filterInstructors(
  instructors: Instructor[],
  filters: { search?: string; category?: string },
): Instructor[] {
  const category = filters.category?.trim() ?? '';

  return instructors.filter((instructor) => {
    if (category && instructor.category !== category) return false;
    if (!matchesInstructorSearch(instructor, filters.search ?? '')) return false;
    return true;
  });
}

/** Sorts the directory. The sort is stable within equal keys. */
export function sortInstructors(
  instructors: Instructor[],
  sort: InstructorSort = 'rated',
): Instructor[] {
  const sorted = [...instructors];

  switch (sort) {
    case 'popular':
      sorted.sort(
        (a, b) =>
          b.totalStudents - a.totalStudents ||
          b.rating - a.rating ||
          a.name.localeCompare(b.name),
      );
      break;
    case 'courses':
      sorted.sort(
        (a, b) =>
          b.totalCourses - a.totalCourses ||
          b.rating - a.rating ||
          a.name.localeCompare(b.name),
      );
      break;
    case 'rated':
    default:
      sorted.sort(
        (a, b) =>
          b.rating - a.rating ||
          b.reviewCount - a.reviewCount ||
          a.name.localeCompare(b.name),
      );
      break;
  }

  return sorted;
}

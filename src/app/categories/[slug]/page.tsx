import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Star, BookOpen, ArrowRight } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { CategoryHero, getCategoryMeta, CATEGORY_META } from '@/components/category/CategoryHero';
import { CategorySortSelect } from '@/components/category/CategorySortSelect';
import { cn } from '@/lib/utils';
import type { Course, Category } from '@/types';

// ── Static params ──────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const categories: Category[] = await coursesApi.getCategories();
    return categories.map((cat) => ({
      slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    }));
  } catch {
    // Fall back to the known set so the build doesn't fail without an API
    return Object.keys(CATEGORY_META).map((slug) => ({ slug }));
  }
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const meta = getCategoryMeta(params.slug);
  return {
    title: `${meta.name} Courses`,
    description: meta.description,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Derive subcategory pills from course titles (first two title words after removing the category name) */
function deriveSubcategories(courses: Course[], categoryName: string): string[] {
  const stop = new Set(['and', 'the', 'of', 'for', 'in', 'a', 'an', 'to', 'with', 'on', categoryName.toLowerCase()]);
  const counts = new Map<string, number>();

  for (const c of courses) {
    const words = c.title.toLowerCase().split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, '');
      if (clean.length > 3 && !stop.has(clean)) {
        counts.set(clean, (counts.get(clean) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

/** Top 3 instructors ranked by number of courses, then total enrollments */
interface InstructorSpot {
  address: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  courseCount: number;
  totalEnrollments: number;
  avgRating: number | null;
}

function buildInstructorSpotlights(courses: Course[]): InstructorSpot[] {
  const map = new Map<string, InstructorSpot>();

  for (const c of courses) {
    const addr = c.instructorAddress;
    const existing = map.get(addr);
    const enrols = c._count?.enrollments ?? 0;
    if (existing) {
      existing.courseCount += 1;
      existing.totalEnrollments += enrols;
      if (c.rating != null) {
        existing.avgRating =
          existing.avgRating == null
            ? c.rating
            : (existing.avgRating + c.rating) / 2;
      }
    } else {
      map.set(addr, {
        address: addr,
        name: c.instructor?.name ?? null,
        avatarUrl: c.instructor?.avatarUrl ?? null,
        bio: c.instructor?.bio ?? null,
        courseCount: 1,
        totalEnrollments: enrols,
        avgRating: c.rating ?? null,
      });
    }
  }

  return [...map.values()]
    .sort(
      (a, b) =>
        b.courseCount - a.courseCount ||
        b.totalEnrollments - a.totalEnrollments,
    )
    .slice(0, 3);
}

/** Related categories — all known categories minus the current one */
function getRelatedCategories(currentSlug: string): Array<{ slug: string; name: string; icon: string }> {
  return Object.entries(CATEGORY_META)
    .filter(([slug]) => slug !== currentSlug)
    .slice(0, 6)
    .map(([slug, meta]) => ({ slug, name: meta.name, icon: meta.icon }));
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sub?: string; sort?: string };
}) {
  const { slug } = params;
  const meta = getCategoryMeta(slug);

  // Convert slug back to the API category name
  const categoryName = meta.name;

  // Fetch all courses in this category (up to 100 for static render)
  let courses: Course[] = [];
  try {
    const res = await coursesApi.list({ category: categoryName, limit: 100 });
    courses = res.data ?? [];
  } catch {
    // Leave courses as [] — will show the empty state
  }

  // 404 for unknown slugs that also have no courses
  const isKnownSlug = slug in CATEGORY_META;
  if (!isKnownSlug && courses.length === 0) {
    notFound();
  }

  // ── Derived data ──────────────────────────────────────────────
  const subcategories = deriveSubcategories(courses, categoryName);
  const activeSub = searchParams.sub ?? '';
  const activeSort = searchParams.sort ?? 'popular';

  // Client-side filtering / sorting is handled below with the URL state
  let displayed = activeSub
    ? courses.filter((c) =>
        c.title.toLowerCase().includes(activeSub.toLowerCase()),
      )
    : courses;

  if (activeSort === 'newest') {
    displayed = [...displayed].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (activeSort === 'rated') {
    displayed = [...displayed].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    // popular (default)
    displayed = [...displayed].sort(
      (a, b) => (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0),
    );
  }

  const instructors = buildInstructorSpotlights(courses);
  const relatedCategories = getRelatedCategories(slug);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ink-50">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <CategoryHero slug={slug} courseCount={courses.length} />

      <main id="category-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* ── Subcategory filter pills + sort ───────────────── */}
        {(subcategories.length > 0 || true) && (
          <section aria-label="Filter courses">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Pills — horizontally scrollable on mobile */}
              <div
                className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-none"
                role="group"
                aria-label="Subcategory filters"
              >
                {/* "All" pill */}
                <Link
                  href={`/categories/${slug}?sort=${activeSort}`}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
                    !activeSub
                      ? 'bg-hamplard-primary text-white border-hamplard-primary shadow-sm'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-hamplard-primary hover:text-hamplard-primary',
                  )}
                  aria-pressed={!activeSub}
                >
                  All
                </Link>

                {subcategories.map((sub) => (
                  <Link
                    key={sub}
                    href={`/categories/${slug}?sub=${encodeURIComponent(sub)}&sort=${activeSort}`}
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
                      activeSub.toLowerCase() === sub.toLowerCase()
                        ? 'bg-hamplard-primary text-white border-hamplard-primary shadow-sm'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-hamplard-primary hover:text-hamplard-primary',
                    )}
                    aria-pressed={activeSub.toLowerCase() === sub.toLowerCase()}
                  >
                    {sub}
                  </Link>
                ))}
              </div>

              {/* Sort select — client component for router.push navigation */}
              <CategorySortSelect slug={slug} activeSub={activeSub} activeSort={activeSort} />
            </div>

            {/* Result count */}
            <p className="mt-3 text-sm text-ink-500" aria-live="polite">
              Showing{' '}
              <span className="font-semibold text-ink-800">{displayed.length}</span>{' '}
              {displayed.length === 1 ? 'course' : 'courses'}
              {activeSub && (
                <>
                  {' '}matching{' '}
                  <span className="font-semibold text-hamplard-primary">{activeSub}</span>
                </>
              )}
            </p>
          </section>
        )}

        {/* ── Course grid ───────────────────────────────────── */}
        <section aria-label={`${meta.name} courses`}>
          {displayed.length === 0 ? (
            <div className="card p-14 text-center">
              <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
              <p className="text-sm font-medium text-ink-700">No courses found</p>
              <p className="text-xs text-ink-400 mt-1">
                Try a different subcategory filter.
              </p>
              <Link
                href={`/categories/${slug}`}
                className="btn-primary mt-4 inline-flex"
              >
                Clear filter
              </Link>
            </div>
          ) : (
            /* 2-col mobile → 3-col tablet → 4-col desktop */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {displayed.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  priority={i < 4}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Instructor spotlight ──────────────────────────── */}
        {instructors.length > 0 && (
          <section aria-labelledby="instructor-spotlight-heading">
            <div className="flex items-center justify-between mb-5">
              <h2
                id="instructor-spotlight-heading"
                className="section-heading"
              >
                Top instructors in {meta.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map((inst) => {
                const initials = inst.name
                  ? inst.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : '??';

                return (
                  <div
                    key={inst.address}
                    className="card p-5 flex items-start gap-4 hover:shadow-lifted transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative w-12 h-12 rounded-full overflow-hidden bg-hamplard-lilac flex items-center justify-center">
                      {inst.avatarUrl ? (
                        <Image
                          src={inst.avatarUrl}
                          alt={inst.name ?? 'Instructor'}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-hamplard-deep" aria-hidden="true">
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">
                        {inst.name ?? 'Hamplard Instructor'}
                      </p>
                      {inst.bio && (
                        <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">
                          {inst.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="flex items-center gap-1 text-xs text-ink-500">
                          <BookOpen className="w-3 h-3" aria-hidden="true" />
                          {inst.courseCount} {inst.courseCount === 1 ? 'course' : 'courses'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-ink-500">
                          <Users className="w-3 h-3" aria-hidden="true" />
                          {inst.totalEnrollments.toLocaleString()} students
                        </span>
                        {inst.avgRating != null && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {inst.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Related categories ────────────────────────────── */}
        {relatedCategories.length > 0 && (
          <section aria-labelledby="related-categories-heading">
            <h2
              id="related-categories-heading"
              className="section-heading mb-5"
            >
              Explore more categories
            </h2>

            {/* Horizontally scrollable on mobile, wrapping grid on md+ */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:pb-0 scrollbar-none">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="flex-shrink-0 w-36 md:w-auto card p-4 flex flex-col items-center gap-2 text-center hover:shadow-lifted hover:-translate-y-0.5 transition-all group"
                >
                  <span className="text-3xl" aria-hidden="true">{cat.icon}</span>
                  <span className="text-xs font-semibold text-ink-700 group-hover:text-hamplard-primary transition-colors leading-snug">
                    {cat.name}
                  </span>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-ink-300 group-hover:text-hamplard-primary transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

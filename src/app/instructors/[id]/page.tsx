import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Star,
  Twitter,
  Users,
} from 'lucide-react';
import { getInstructorForMetadata } from '@/lib/api/server';
import { buildMetadata, siteConfig } from '@/lib/seo';
import { buildInstructorJsonLd } from '@/lib/structured-data';
import { CourseCard } from '@/components/courses/CourseCard';
import { ReviewCard } from '@/components/Reviews/ReviewCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

type PageProps = {
  params: { id: string };
};

/** Social links rendered in the profile header. */
const SOCIAL_ICONS = [
  { key: 'website', label: 'Website', Icon: Globe },
  { key: 'twitter', label: 'Twitter', Icon: Twitter },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const instructor = await getInstructorForMetadata(params.id);

  if (!instructor) {
    return buildMetadata({
      title: 'Instructor',
      description: `Browse practical, job-ready courses on ${siteConfig.name}.`,
      path: `/instructors/${params.id}`,
    });
  }

  const description =
    instructor.bio?.trim().slice(0, 300) ||
    instructor.headline?.trim() ||
    `${instructor.name} teaches ${instructor.totalCourses} course${instructor.totalCourses === 1 ? '' : 's'} on ${siteConfig.name}.`;

  return buildMetadata({
    title: instructor.name,
    description,
    path: `/instructors/${params.id}`,
    type: 'profile',
    images: instructor.avatarUrl ? [instructor.avatarUrl] : undefined,
  });
}

function InstructorHeader({ instructor }: { instructor: Awaited<ReturnType<typeof getInstructorForMetadata>> }) {
  if (!instructor) return null;

  const initials = instructor.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  const socials = SOCIAL_ICONS.flatMap(({ key, label, Icon }) => {
    const href = instructor[key];
    return href ? [{ label, Icon, href }] : [];
  });

  return (
    <header className="card overflow-hidden">
      {/* ── Banner ── */}
      <div className="h-28 bg-gradient-to-r from-hamplard-lilac via-hamplard-primary to-saffron-300" />

      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        {/* ── Avatar ── */}
        <div className="-mt-12 mb-4">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={`${instructor.name} avatar`}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex w-24 h-24 rounded-full bg-hamplard-lilac text-hamplard-deep font-display font-bold text-3xl items-center justify-center ring-4 ring-white shadow-md"
            >
              {initials || '?'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold text-ink-900">
              {instructor.name}
            </h1>
            {instructor.headline && (
              <p className="mt-1 text-sm text-ink-500">{instructor.headline}</p>
            )}
            {instructor.category && (
              <span className="mt-3 inline-flex items-center rounded-lg bg-saffron-50 px-2.5 py-1 text-xs font-semibold text-saffron-700">
                {instructor.category}
              </span>
            )}
          </div>

          {/* ── Social links ── */}
          {socials.length > 0 && (
            <ul className="flex items-center gap-2">
              {socials.map(({ label, Icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${instructor.name} on ${label}`}
                    className="flex w-9 h-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-hamplard-primary hover:text-hamplard-primary"
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Location ── */}
        {instructor.location && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            {instructor.location}
          </p>
        )}

        {/* ── Stats ── */}
        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-ink-50 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              Students
            </dt>
            <dd className="mt-1 text-xl font-bold text-ink-900">
              {instructor.totalStudents.toLocaleString()}
            </dd>
          </div>

          <div className="rounded-2xl bg-ink-50 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Courses
            </dt>
            <dd className="mt-1 text-xl font-bold text-ink-900">
              {instructor.totalCourses.toLocaleString()}
            </dd>
          </div>

          <div className="rounded-2xl bg-ink-50 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <Star className="w-3.5 h-3.5" aria-hidden="true" />
              Average rating
            </dt>
            <dd className="mt-1 text-xl font-bold text-ink-900">
              {instructor.reviewCount > 0 ? instructor.rating.toFixed(1) : '—'}
              {instructor.reviewCount > 0 && (
                <span className="ml-1 text-xs font-normal text-ink-400">
                  ({instructor.reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

export default async function InstructorProfilePage({ params }: PageProps) {
  const instructor = await getInstructorForMetadata(params.id);

  if (!instructor) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl text-center">
          <p className="text-sm font-medium text-saffron-600 mb-3">Instructor not found</p>
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-4">
            This profile is unavailable
          </h1>
          <p className="text-ink-500 mb-6">
            The instructor you are looking for could not be loaded. Browse the directory to find
            another teacher.
          </p>
          <Link href="/instructors" className="btn-primary inline-flex px-6 py-3">
            Browse instructors
          </Link>
        </div>
      </div>
    );
  }

  const courses = instructor.courses ?? [];
  const reviews = instructor.reviews ?? [];

  return (
    <div className="min-h-screen bg-ink-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildInstructorJsonLd(instructor)) }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Instructors', href: '/instructors' },
            { label: instructor.name },
          ]}
        />

        <InstructorHeader instructor={instructor} />

        {/* ── About ── */}
        {instructor.bio && (
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="section-heading mb-3">
              About {instructor.name}
            </h2>
            <div className="card p-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {instructor.bio}
              </p>
            </div>
          </section>
        )}

        {/* ── Courses ── */}
        <section aria-labelledby="courses-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="courses-heading" className="section-heading">
              Courses by {instructor.name}
            </h2>
            <Link
              href="/instructors"
              className="text-sm font-medium text-hamplard-primary hover:text-hamplard-mid transition-colors"
            >
              All instructors
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm font-medium text-ink-700">No published courses yet</p>
              <p className="text-xs text-ink-400 mt-1">
                This instructor has not published a course so far.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="section-heading mb-4">
              Learner reviews
            </h2>
            <div className="space-y-4">
              {reviews.slice(0, 10).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

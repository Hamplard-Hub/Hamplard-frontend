import Link from 'next/link';
import { notFound } from 'next/navigation';
import { coursesApi } from '@/lib/api/services';
import { Breadcrumb } from '@/components/ui';
import { ShowcaseGallery } from '@/components/showcase';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { Course } from '@/types';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props) {
  try {
    const course = await coursesApi.get(params.id);
    return {
      title: `Student Showcase - ${course.title} | Hamplard`,
      description: `Explore student projects and finished work from ${course.title} on Hamplard.`,
    };
  } catch {
    return {
      title: 'Student Project Showcase | Hamplard',
      description: 'Explore student projects and finished work on Hamplard.',
    };
  }
}

export default async function ShowcasePage({ params }: Props) {
  let course: Course | null = null;
  try {
    course = await coursesApi.get(params.id);
  } catch {
    // Continue even if course fails to load so showcase can still render with fallback
  }

  const courseTitle = course?.title ?? 'Course';

  return (
    <div className="min-h-screen bg-ink-50 px-5 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: courseTitle, href: `/courses/${params.id}` },
            { label: 'Student Showcase' },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-saffron-600 font-semibold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Learner Spotlight</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-900">
              Student Project Showcase
            </h1>
            <p className="text-ink-600 max-w-2xl text-base">
              Explore authentic practical work submitted by learners enrolled in{' '}
              <span className="font-semibold text-ink-900">{courseTitle}</span>. Like your favorites,
              share feedback, and get inspired.
            </p>
          </div>

          <Link
            href={`/courses/${params.id}`}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-medium text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>
        </div>

        <ShowcaseGallery courseId={params.id} courseTitle={courseTitle} />
      </div>
    </div>
  );
}

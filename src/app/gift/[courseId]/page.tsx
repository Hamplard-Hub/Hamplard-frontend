'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { coursesApi, giftsApi } from '@/lib/api/services';
import { GiftCheckoutForm } from '@/components/gift/GiftCheckoutForm';
import { Breadcrumb } from '@/components/ui';
import { useToast } from '@/lib/hooks/use-toast';
import type { Course } from '@/types';
import type { GiftFormValues } from '@/lib/validations/gift';

export default function GiftCheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const toast = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    coursesApi
      .get(courseId)
      .then(setCourse)
      .catch(() => setError('This course could not be found.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async (values: GiftFormValues) => {
    try {
      const gift = await giftsApi.create({
        courseId,
        recipientEmail: values.recipientEmail,
        message: values.message || undefined,
        deliveryDate: values.deliveryDate,
      });
      router.push(
        `/gift/${courseId}/confirmation?token=${gift.claimToken}&recipient=${encodeURIComponent(values.recipientEmail)}`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send gift. Please try again.';
      toast.error({ title: 'Gift failed', description: message });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 className="h-6 w-6 animate-spin text-saffron-500" aria-label="Loading" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
          <h1 className="mb-2 font-display text-2xl font-bold text-ink-900">Course not found</h1>
          <p className="mb-6 text-sm text-ink-500">{error}</p>
          <Link href="/courses" className="btn-primary inline-flex px-6 py-3">
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course.title, href: `/courses/${course.id}` },
            { label: 'Gift this course' },
          ]}
        />

        <div>
          <Link
            href={`/courses/${course.id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to course
          </Link>
          <h1 className="section-heading">Gift this course</h1>
          <p className="mt-1 text-sm text-ink-500">
            Send <strong className="font-medium text-ink-800">{course.title}</strong> as a gift.
            The recipient will get an email with a link to claim it.
          </p>
        </div>

        <div className="card p-6">
          <GiftCheckoutForm
            courseTitle={course.title}
            coursePrice={course.price}
            onSubmit={handleSubmit}
          />
        </div>

        <p className="text-center text-xs text-ink-400">
          The recipient will receive a gift link by email. Claimed courses appear in their
          enrolled courses dashboard.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Users, BookOpen, Award,
  Loader2, CheckCircle2, Lock,
} from 'lucide-react';
import { coursesApi, enrollmentsApi } from '@/lib/api/services';
import { enrollInCourse } from '@/lib/stellar/contract';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import {
  formatUsdc, formatDuration, levelChip, timeAgo, usdcToStroops,
} from '@/lib/utils';
import type { Course, Enrollment } from '@/types';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address, isConnected } = useAuthStore();

  const [course,     setCourse]     = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [enrolling,  setEnrolling]  = useState(false);
  const [txStep,     setTxStep]     = useState('');
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    coursesApi.get(id).then(setCourse).catch(console.error).finally(() => setLoading(false));
    if (isConnected) {
      enrollmentsApi.get(id).then(setEnrollment).catch(() => {});
    }
  }, [id, isConnected]);

  const isEnrolled = !!enrollment;
  const totalLessons = course?.modules?.flatMap((m) => m.lessons).length ?? 0;

  const handleEnroll = async () => {
    if (!address || !course) return;
    setError(null);
    setEnrolling(true);
    try {
      setTxStep('Signing payment in Freighter…');
      const txHash = await enrollInCourse({ callerAddress: address, courseId: id });

      setTxStep('Registering enrollment…');
      await enrollmentsApi.create({
        courseId: id,
        txHash,
        amountPaid: course.price,
      });

      router.push(`/dashboard/courses/${id}/learn`);
    } catch (err: any) {
      setError(err?.message ?? 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
      setTxStep('');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="text-center py-16">
      <p className="text-ink-500">Course not found.</p>
      <Link href="/" className="btn-secondary mt-4 inline-flex">Back to courses</Link>
    </div>
  );

  return (
    <div>
      <Link href="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-saffron-100 to-saffron-200 mb-5">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">
                {course.category === 'Tailoring' ? '🧵' :
                 course.category === 'Baking' ? '🍰' :
                 course.category === 'Photography' ? '📷' : '🎓'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <p className="text-sm font-medium text-saffron-600">{course.category}</p>
            <span className={levelChip(course.level)}>{course.level}</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink-900 mb-3">{course.title}</h1>

          <p className="text-ink-500 leading-relaxed mb-5">{course.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-5 text-sm text-ink-500 mb-6">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {course._count?.enrollments?.toLocaleString() ?? 0} students
            </span>
            <span className="flex items-center gap-1.5">
              By {course.instructor?.name ?? 'Instructor'}
            </span>
          </div>

          {/* Curriculum */}
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">Course curriculum</h2>
            <div className="space-y-3">
              {course.modules?.map((module, mi) => (
                <div key={module.id} className="card overflow-hidden">
                  <div className="px-4 py-3 bg-ink-50 border-b border-ink-100">
                    <p className="text-sm font-semibold text-ink-800">
                      Module {mi + 1}: {module.title}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-ink-50">
                    {module.lessons.map((lesson, li) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                        {lesson.isFree
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-leaf-500 flex-shrink-0" />
                          : <Lock className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
                        }
                        <span className="text-sm text-ink-700 flex-1">{lesson.title}</span>
                        {lesson.videoDuration && (
                          <span className="text-xs text-ink-400">
                            {formatDuration(lesson.videoDuration)}
                          </span>
                        )}
                        {lesson.isFree && (
                          <span className="text-[10px] font-medium text-leaf-600 bg-leaf-50 px-1.5 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky enrollment card */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-5">
            <div className="text-3xl font-bold text-ink-900 mb-1">
              {formatUsdc(course.price)}
              <span className="text-sm font-normal text-ink-400 ml-1.5">USDC</span>
            </div>
            <p className="text-xs text-ink-400 mb-4">
              One-time payment · Lifetime access
            </p>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {isEnrolled ? (
              <Link href={`/dashboard/courses/${id}/learn`} className="btn-leaf w-full text-base py-3">
                <CheckCircle2 className="w-4 h-4" />
                Continue learning
              </Link>
            ) : isConnected ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn-primary w-full text-base py-3"
              >
                {enrolling
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{txStep || 'Processing…'}</>
                  : `Enroll for ${formatUsdc(course.price)}`
                }
              </button>
            ) : (
              <Link href={`/auth/login?callbackUrl=/dashboard/courses/${id}`}
                className="btn-primary w-full text-base py-3 text-center block">
                Sign in to enroll
              </Link>
            )}

            <p className="text-xs text-ink-400 text-center mt-3">
              Payment secured on Stellar. Certificate on completion.
            </p>

            <div className="mt-4 pt-4 border-t border-ink-100 space-y-2">
              {[
                { icon: BookOpen, text: `${totalLessons} structured lessons` },
                { icon: Clock,    text: `${Math.ceil((course.totalDuration ?? 0) / 60)}+ minutes of content` },
                { icon: Award,    text: 'Blockchain-verified certificate' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-ink-500">
                  <Icon className="w-3.5 h-3.5 text-saffron-500 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

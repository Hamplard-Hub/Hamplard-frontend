'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { X, Star, Clock, BookOpen, Award, User } from 'lucide-react';
import { useCompareStore } from '@/lib/hooks/use-compare-store';
import { formatUsdc, courseTotalMins, cn } from '@/lib/utils';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAHklEQVQI12NgYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==';

export default function ComparePage() {
  const router = useRouter();
  const courses = useCompareStore((state) => state.courses);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);

  useEffect(() => {
    if (courses.length === 0) {
      router.push('/courses');
    }
  }, [courses.length, router]);

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-heading mb-1">Compare Courses</h1>
            <p className="text-sm text-ink-400">
              Compare up to 3 courses side by side
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clear}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Clear All
            </button>
            <Link
              href="/courses"
              className="btn-primary px-4 py-2 text-sm"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-semibold text-ink-900 border-r border-ink-200 w-40">
                    Course
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4 align-top min-w-[280px]">
                      <div className="relative">
                        <button
                          onClick={() => remove(course.id)}
                          aria-label={`Remove ${course.title}`}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-white shadow hover:bg-ink-50 transition-colors z-10"
                        >
                          <X className="w-4 h-4 text-ink-500" />
                        </button>
                        
                        <Link href={`/dashboard/courses/${course.id}`} className="block">
                          <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                            {course.thumbnailUrl ? (
                              <Image
                                src={course.thumbnailUrl}
                                alt={course.title}
                                fill
                                sizes="280px"
                                className="object-cover"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-saffron-100 to-saffron-200">
                                <span className="text-4xl">
                                  {course.category === 'Tailoring' ? '🧵' :
                                   course.category === 'Baking' ? '🍰' :
                                   course.category === 'Photography' ? '📷' :
                                   course.category === 'Makeup Artistry' ? '💄' :
                                   course.category === 'Hairstyling' ? '💇' :
                                   course.category === 'Nail Technology' ? '💅' : '🎓'}
                                </span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-ink-900 text-sm mb-1 line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-saffron-600 mb-2">{course.category}</p>
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {/* Price */}
                <tr className="border-b border-ink-100">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    <div className="flex items-center gap-2">
                      Price
                    </div>
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-ink-900">
                          {formatUsdc(course.price)}
                          <span className="text-xs font-normal text-ink-400 ml-1">USDC</span>
                        </span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-sm text-ink-400 line-through">
                            {formatUsdc(course.originalPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b border-ink-100">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Rating
                    </div>
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      {course.rating != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-4 h-4',
                                  star <= Math.round(course.rating!)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-200'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-ink-700">
                            {course.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-ink-400">
                            ({course.reviewCount?.toLocaleString() ?? 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-ink-400">No ratings yet</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Duration */}
                <tr className="border-b border-ink-100">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </div>
                  </th>
                  {courses.map((course) => {
                    const mins = courseTotalMins(course.totalDuration ?? 0);
                    return (
                      <td key={course.id} className="p-4">
                        <span className="text-sm text-ink-700">
                          {mins < 60
                            ? `${mins} minutes`
                            : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Lectures */}
                <tr className="border-b border-ink-100">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Lectures
                    </div>
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      <span className="text-sm text-ink-700">
                        {course.totalLessons} lessons
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Level */}
                <tr className="border-b border-ink-100">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    Level
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-ink-100 text-ink-700 capitalize">
                        {course.level}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Certificate */}
                <tr className="border-b border-ink-100">
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certificate
                    </div>
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      <span className="text-sm text-ink-700">
                        Certificate of completion
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Instructor */}
                <tr>
                  <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-medium text-ink-700 border-r border-ink-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Instructor
                    </div>
                  </th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      <div className="flex items-center gap-2">
                        {course.instructor?.avatarUrl ? (
                          <Image
                            src={course.instructor.avatarUrl}
                            alt={course.instructor.name ?? 'Instructor'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-saffron-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-saffron-600" />
                          </div>
                        )}
                        <span className="text-sm text-ink-700">
                          {course.instructor?.name ?? 'Hamplard Instructor'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* CTA Row */}
                <tr>
                  <th className="sticky left-0 bg-white z-10 p-4 border-r border-ink-200"></th>
                  {courses.map((course) => (
                    <td key={course.id} className="p-4">
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="btn-primary w-full text-center block py-2.5"
                      >
                        View Course
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

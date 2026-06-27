'use client';

import { CourseCard } from './CourseCard';
import { CourseCardSkeleton } from './CourseCardSkeleton';
import type { Course } from '@/types';

interface Props {
  courses: Course[];
  loading?: boolean;
  skeletons?: number;
}

export function CourseCardGrid({ courses, loading = false, skeletons = 8 }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading
        ? Array.from({ length: skeletons }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))
        : courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
    </div>
  );
}

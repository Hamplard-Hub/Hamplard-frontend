'use client';

import Link from 'next/link';
import { Clock, Users, Star } from 'lucide-react';
import {
  formatUsdc, levelChip, courseTotalMins, cn,
} from '@/lib/utils';
import type { Course } from '@/types';

interface Props {
  course: Course;
  href?: string;
  showProgress?: number; // 0-100 for enrolled view
}

export function CourseCard({ course, href, showProgress }: Props) {
  const dest = href ?? `/dashboard/courses/${course.id}`;
  const mins = courseTotalMins(course.totalDuration ?? 0);

  return (
    <Link href={dest} className="group block">
      <div className="card overflow-hidden hover:shadow-lifted transition-shadow duration-200">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-saffron-100 to-saffron-200 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">
                {course.category === 'Tailoring'      ? '🧵' :
                 course.category === 'Baking'         ? '🍰' :
                 course.category === 'Photography'    ? '📷' :
                 course.category === 'Makeup Artistry'? '💄' :
                 course.category === 'Hairstyling'    ? '💇' :
                 course.category === 'Nail Technology'? '💅' : '🎓'}
              </span>
            </div>
          )}
          <div className="absolute top-2.5 left-2.5">
            <span className={levelChip(course.level)}>{course.level}</span>
          </div>
          {course.previewVideoUrl && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-ink-800 ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-saffron-600 font-medium mb-1">{course.category}</p>
          <h3 className="text-sm font-semibold text-ink-900 mb-2 line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-ink-500 mb-3 truncate">
            {course.instructor?.name ?? 'Hamplard Instructor'}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[11px] text-ink-400 mb-3">
            {mins > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`}
              </span>
            )}
            {course.totalLessons > 0 && (
              <span>{course.totalLessons} lessons</span>
            )}
            {course._count?.enrollments > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course._count.enrollments.toLocaleString()}
              </span>
            )}
          </div>

          {/* Progress bar (enrolled view) */}
          {showProgress !== undefined && (
            <div className="mb-3">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${showProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-400 mt-1">{showProgress}% complete</p>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-base font-bold text-ink-900">
              {formatUsdc(course.price)}
              <span className="text-xs font-normal text-ink-400 ml-1">USDC</span>
            </span>
            {course.status === 'ACTIVE' && (
              <span className="text-xs font-medium text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded-lg">
                Enroll now
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, DollarSign, BookOpen, Clock } from 'lucide-react';
import { usersApi, coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { courseStatusBadge, formatUsdc } from '@/lib/utils';
import type { Course } from '@/types';

export default function InstructorDashboardPage() {
  const [stats,   setStats]   = useState<any>(null);
  const [pending, setPending] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.getInstructorStats(),
    ]).then(([s]) => {
      setStats(s);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading">Instructor Dashboard</h1>
        <Link href="/dashboard/courses/create" className="btn-primary">
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen,    label: 'Courses',   value: stats?.totalCourses ?? 0 },
          { icon: Users,       label: 'Students',  value: stats?.totalStudents ?? 0 },
          { icon: DollarSign,  label: 'Revenue',   value: formatUsdc(stats?.totalRevenue ?? 0) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-saffron-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-saffron-600" />
              </div>
              <p className="text-xs text-ink-400">{label}</p>
            </div>
            <p className="text-2xl font-bold text-ink-900">{value}</p>
          </div>
        ))}
      </div>

      {/* My courses */}
      <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">My courses</h2>
      {!stats?.courses?.length ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No courses yet</p>
          <p className="text-xs text-ink-400 mt-1">Create your first course to start teaching.</p>
          <Link href="/dashboard/courses/create" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" />
            Create course
          </Link>
        </div>
      ) : (
        <div className="course-grid">
          {stats.courses.map((course: Course) => (
            <div key={course.id} className="relative">
              <div className="absolute top-2.5 right-2.5 z-10">
                <span className={courseStatusBadge(course.status)}>{course.status}</span>
              </div>
              <CourseCard course={course} href={`/dashboard/courses/${course.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

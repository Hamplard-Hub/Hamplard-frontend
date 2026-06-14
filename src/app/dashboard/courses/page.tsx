'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search } from 'lucide-react';
import { enrollmentsApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import type { Enrollment } from '@/types';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

export default function DashboardCoursesPage() {
  const { user } = useAuthStore();
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    if (isInstructor) { setLoading(false); return; }
    enrollmentsApi.getMy()
      .then((r) => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isInstructor]);

  const filtered = enrollments.filter((e) =>
    e.course?.title?.toLowerCase().includes(search.toLowerCase()),
  );

  // Instructor view — redirect to instructor dashboard
  if (isInstructor) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-heading">My Courses</h1>
          <Link href="/dashboard/courses/create" className="btn-primary">
            <Plus className="w-4 h-4" />
            New course
          </Link>
        </div>
        <div className="card p-8 text-center">
          <BookOpen className="w-10 h-10 text-saffron-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">Go to your instructor dashboard</p>
          <Link href="/dashboard/instructor" className="btn-primary mt-4 inline-flex">
            View dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-heading">My Learning</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <Link href="/" className="btn-secondary">
          Browse more courses
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search my courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {loading ? (
        <div className="course-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-ink-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-ink-100 rounded w-20" />
                <div className="h-4 bg-ink-100 rounded w-full" />
                <div className="h-3 bg-ink-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No courses yet</p>
          <p className="text-xs text-ink-400 mt-1">
            Browse the course catalogue and start learning today.
          </p>
          <Link href="/" className="btn-primary mt-4 inline-flex">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="course-grid">
          {filtered.map((e) => (
            <CourseCard
              key={e.id}
              course={e.course}
              href={`/dashboard/courses/${e.courseId}/learn`}
              showProgress={e.progressPercent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

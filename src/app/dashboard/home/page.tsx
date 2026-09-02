'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { ContinueLearning } from '@/components/dashboard/ContinueLearning';
import { OnboardingModal } from '@/components/dashboard/OnboardingModal';
import { StreakTracker } from '@/components/dashboard/StreakTracker';
import { BottomTabs } from '@/components/layout/BottomTabs';
import {
  QuickStatsSkeleton,
  ContinueLearningSkeletonList,
  CourseGridSkeleton,
} from '@/components/skeletons';
import { enrollmentsApi, coursesApi, usersApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import type { Course } from '@/types';
import Link from 'next/link';

function QuickStatsSection() {
  const [stats, setStats] = useState<Array<{ label: string; value: string | number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentsApi
      .getMy(1, 20)
      .then((res) => {
        const enrollments = res.data;
        setStats([
          { label: 'Courses', value: enrollments.length },
          { label: 'Completed', value: enrollments.filter((e) => e.status === 'COMPLETED').length },
          { label: 'Certificates', value: enrollments.filter((e) => e.progressPercent === 100).length },
        ]);
      })
      .catch(() => {
        setStats([
          { label: 'Courses', value: 0 },
          { label: 'Completed', value: 0 },
          { label: 'Certificates', value: 0 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <QuickStatsSkeleton />;
  }

  return <QuickStats stats={stats} />;
}

function ContinueLearningSection() {
  const [items, setItems] = useState<Array<{ id: string; title: string; progress: number; href: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentsApi
      .getMy(1, 20)
      .then((res) => {
        const inProgress = res.data
          .filter((e) => e.progressPercent < 100)
          .slice(0, 4)
          .map((e) => ({
            id: e.courseId,
            title: e.course?.title ?? 'Untitled',
            progress: e.progressPercent,
            href: `/dashboard/courses/${e.courseId}/learn`,
          }));
        setItems(inProgress);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ContinueLearningSkeletonList count={2} />;
  }

  return <ContinueLearning items={items} />;
}

function CourseGridSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi
      .list({ limit: 6 })
      .then((res) => setCourses(res.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <CourseGridSkeleton count={3} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course) => (
        <div key={course.id} className="card p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-ink-900">{course.title}</h3>
            <p className="text-xs text-ink-500 line-clamp-2 mt-1">{course.description}</p>
          </div>
          <Link href={`/courses/${course.id}`} className="btn-secondary mt-3 inline-flex text-xs self-start">
            View course
          </Link>
        </div>
      ))}
      {courses.length === 0 && (
        <div className="col-span-full card p-4 text-xs text-ink-500">
          No recommended courses found.
        </div>
      )}
    </div>
  );
}

export function DashboardContent() {
  const { user } = useAuthStore();
  const [userName, setUserName] = useState(user?.name ?? 'Student');

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
      return;
    }
    usersApi
      .getMe()
      .then((u) => setUserName(u.name ?? 'Student'))
      .catch(() => {});
  }, [user]);

  return (
    <div>
      <OnboardingModal />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center text-xl font-bold">
                {userName?.slice(0, 1)}
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Welcome back, {userName}</h1>
                <p className="text-sm text-ink-500 mt-0.5">
                  Here's what's happening with your learning
                </p>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <Link href="/dashboard/courses" className="btn-secondary">My Courses</Link>
              <Link href="/" className="btn-primary">Browse</Link>
            </div>
          </div>

          <section className="mb-6">
            <h2 className="section-heading">Continue learning</h2>
            <Suspense fallback={<ContinueLearningSkeletonList count={2} />}>
              <ContinueLearningSection />
            </Suspense>
          </section>

          <section className="mb-6">
            <h2 className="section-heading">Recommended for you</h2>
            <Suspense fallback={<CourseGridSkeleton count={3} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />}>
              <CourseGridSection />
            </Suspense>
          </section>
        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <Suspense fallback={<QuickStatsSkeleton />}>
            <QuickStatsSection />
          </Suspense>

          <StreakTracker />

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Achievements</h3>
            <p className="text-xs text-ink-500 mt-2">
              Complete courses to earn certificates and track your learning progress.
            </p>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Certificates</h3>
            <p className="text-xs text-ink-500 mt-2">
              Complete courses to earn certificates.
            </p>
            <Link href="/dashboard/certificates" className="btn-secondary mt-3 inline-flex text-xs">
              View certificates
            </Link>
          </div>
        </aside>
      </div>

      <BottomTabs />
    </div>
  );
}

export default function DashboardHomePage() {
  return <DashboardContent />;
}

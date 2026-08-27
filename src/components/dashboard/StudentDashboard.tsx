'use client';

import React from 'react';
import { ContinueLearning } from '@/components/dashboard/ContinueLearning';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { StreakTracker } from '@/components/dashboard/StreakTracker';
import Link from 'next/link';

interface InProgressItem {
  id: string;
  title: string;
  progress: number;
  href: string;
}

interface StatItem {
  label: string;
  value: string | number;
}

interface Props {
  name?: string;
  /** Live stats derived from the parent page (falls back to sample data). */
  stats?: StatItem[];
  /** In-progress courses derived from the parent page (falls back to sample data). */
  inProgress?: InProgressItem[];
}

export function StudentDashboard({
  name = 'Student',
  stats,
  inProgress,
}: Props) {
  const resolvedInProgress: InProgressItem[] = inProgress ?? [
    { id: '1', title: 'React Basics',  progress: 32, href: '/dashboard/courses/1/learn' },
    { id: '2', title: 'Advanced CSS',  progress: 67, href: '/dashboard/courses/2/learn' },
  ];

  const resolvedStats: StatItem[] = stats ?? [
    { label: 'Courses',      value: 3  },
    { label: 'Hours',        value: '12h' },
    { label: 'Certificates', value: 1  },
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        {/* Welcome header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center text-xl font-bold">
              {name?.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
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

        {/* Continue learning */}
        <section className="mb-6">
          <h2 className="section-heading">Continue learning</h2>
          <ContinueLearning items={resolvedInProgress} />
        </section>

        {/* Recommendations placeholder */}
        <section>
          <h2 className="section-heading">Recommended for you</h2>
          <div className="card p-4">
            This carousel placeholder will show personalised recommendations.
          </div>
        </section>
      </div>

      {/* Aside — stats + achievements */}
      <aside className="col-span-12 lg:col-span-4 space-y-4">
        <QuickStats stats={resolvedStats} />
        <StreakTracker />

        <div className="card p-4">
          <h3 className="text-sm font-semibold">Achievements</h3>
          <p className="text-xs text-ink-500 mt-2">
            You have {resolvedStats.find((s) => s.label === 'Certificates')?.value ?? 0} certificate
            {(resolvedStats.find((s) => s.label === 'Certificates')?.value ?? 0) !== 1 ? 's' : ''}.
            View them on your profile.
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
  );
}

export default StudentDashboard;

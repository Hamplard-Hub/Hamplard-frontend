'use client';

import React from 'react';
import { ContinueLearning } from '@/components/dashboard/ContinueLearning';
import { QuickStats } from '@/components/dashboard/QuickStats';
import Link from 'next/link';

export function StudentDashboard({
  name = 'Student',
  avatar = '',
}: { name?: string; avatar?: string }) {
  const sampleInProgress = [
    { id: '1', title: 'React Basics', progress: 32, href: '/dashboard/courses/1/learn' },
    { id: '2', title: 'Advanced CSS', progress: 67, href: '/dashboard/courses/2/learn' },
  ];

  const stats = [
    { label: 'Courses', value: 3 },
    { label: 'Hours', value: '12h' },
    { label: 'Certificates', value: 1 },
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center text-xl font-bold">{name?.slice(0,1)}</div>
            <div>
              <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
              <p className="text-sm text-ink-500 mt-0.5">Here's what's happening with your learning</p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <Link href="/dashboard/courses" className="btn-secondary">My Courses</Link>
            <Link href="/" className="btn-primary">Browse</Link>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="section-heading">Continue learning</h2>
          <ContinueLearning items={sampleInProgress} />
        </section>

        <section>
          <h2 className="section-heading">Recommended for you</h2>
          <div className="card p-4">This carousel placeholder will show personalized recommendations.</div>
        </section>
      </div>

      <aside className="col-span-12 lg:col-span-4 space-y-4">
        <QuickStats stats={stats} />

        <div className="card p-4">
          <h3 className="text-sm font-semibold">Achievements</h3>
          <p className="text-xs text-ink-500 mt-2">You have 1 certificate. View them on your profile.</p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold">Certificates</h3>
          <p className="text-xs text-ink-500 mt-2">No recent awards. Complete courses to earn certificates.</p>
        </div>
      </aside>
    </div>
  );
}

export default StudentDashboard;

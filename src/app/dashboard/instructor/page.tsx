'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Users,
  DollarSign,
  BookOpen,
  Clock,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { usersApi, coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { RevenueChart } from '@/components/instructor/RevenueChart';
import { courseStatusBadge, formatUsdc } from '@/lib/utils';
import type { Course } from '@/types';

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '12m'>('12m');
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);

  useEffect(() => {
    Promise.all([usersApi.getInstructorStats()])
      .then(([s]) => {
        setStats(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Simulate fetching revenue data based on date range
  useEffect(() => {
    setRevenueLoading(true);
    const timer = setTimeout(() => {
      const months = dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
      const data = generateRevenueData(months);
      setRevenueData(data);

      // Calculate this month's revenue
      const today = new Date();
      const currentMonth = data.find(
        (d) => new Date(d.date).getMonth() === today.getMonth(),
      );
      setThisMonthRevenue(currentMonth?.revenue || 0);

      // Simulate pending payout (15% of total revenue)
      const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
      setPendingPayout(Math.round(totalRevenue * 0.15));

      setRevenueLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [dateRange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading">Instructor Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/instructor/promo-codes"
            className="btn-secondary flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            Promo Codes
          </Link>
          <Link href="/dashboard/courses/create" className="btn-primary">
            <Plus className="w-4 h-4" />
            New course
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, label: 'Courses', value: stats?.totalCourses ?? 0 },
          { icon: Users, label: 'Students', value: stats?.totalStudents ?? 0 },
          {
            icon: DollarSign,
            label: 'Total Revenue',
            value: formatUsdc(stats?.totalRevenue ?? 0),
          },
          {
            icon: TrendingUp,
            label: 'This Month',
            value: formatUsdc(thisMonthRevenue),
          },
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

      {/* Revenue Analytics Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-hamplard-primary" />
            Revenue Analytics
          </h2>
          <div className="flex items-center gap-2">
            {(['3m', '6m', '12m'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-hamplard-primary text-white'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {range === '3m'
                  ? 'Last 3M'
                  : range === '6m'
                    ? 'Last 6M'
                    : 'Last 12M'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Total Revenue',
              value: formatUsdc(stats?.totalRevenue ?? 0),
              icon: '📊',
            },
            {
              label: 'This Month',
              value: formatUsdc(thisMonthRevenue),
              icon: '📈',
            },
            {
              label: 'Pending Payout',
              value: formatUsdc(pendingPayout),
              icon: '⏳',
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xs text-ink-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-ink-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card p-6">
          <RevenueChart data={revenueData} isLoading={revenueLoading} height={350} />
        </div>
      </div>

      {/* My courses */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          My courses
        </h2>
        <Link href="/dashboard/instructor/courses" className="btn-secondary inline-flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Manage courses
        </Link>
      </div>
      {!stats?.courses?.length ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No courses yet</p>
          <p className="text-xs text-ink-400 mt-1">
            Create your first course to start teaching.
          </p>
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
                <span className={courseStatusBadge(course.status)}>
                  {course.status}
                </span>
              </div>
              <CourseCard
                course={course}
                href={`/dashboard/courses/${course.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Generate mock revenue data for the chart
 * In production, this would come from the backend API
 */
function generateRevenueData(months: number) {
  const data = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);

    const monthName = date.toLocaleString('en-US', { month: 'short' });
    const revenue = Math.floor(Math.random() * 4000) + 500; // Random revenue between $500-$4500

    data.push({
      month: monthName,
      revenue,
      date: date.toISOString(),
    });
  }

  return data;
}

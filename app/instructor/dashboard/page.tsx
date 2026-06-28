'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Users, DollarSign, BookOpen, TrendingUp, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { usersApi } from '@/lib/api/services';
import { courseStatusBadge, formatUsdc } from '@/lib/utils';
import type { Course, CourseStatus } from '@/types';

// ── Placeholder revenue data (last 12 months) ────────────────────
const REVENUE_DATA = [
  { month: 'Jan', revenue: 1200 },
  { month: 'Feb', revenue: 1850 },
  { month: 'Mar', revenue: 1400 },
  { month: 'Apr', revenue: 2200 },
  { month: 'May', revenue: 1950 },
  { month: 'Jun', revenue: 2800 },
  { month: 'Jul', revenue: 2400 },
  { month: 'Aug', revenue: 3100 },
  { month: 'Sep', revenue: 2700 },
  { month: 'Oct', revenue: 3400 },
  { month: 'Nov', revenue: 3000 },
  { month: 'Dec', revenue: 3800 },
];

// Enrollment trend sparkline data per course (placeholder)
const trendSeed = (offset: number) =>
  Array.from({ length: 6 }, (_, i) => ({
    w: i,
    v: Math.max(0, offset + i * 2 + Math.round(Math.random() * 4)),
  }));

// ── Sort types ───────────────────────────────────────────────────
type SortKey = 'title' | 'totalEnrollments' | 'totalRevenue';
type SortDir = 'asc' | 'desc';

// ── Custom tooltip for bar chart ─────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-ink-900 mb-0.5">{label}</p>
      <p className="text-saffron-600 font-medium">{formatUsdc(payload[0].value)} USDC</p>
    </div>
  );
};

// ── Mini sparkline per course row ────────────────────────────────
function EnrollmentSparkline({ data }: { data: { w: number; v: number }[] }) {
  return (
    <ResponsiveContainer width={72} height={28}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke="#f59e0b"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function InstructorDashboardPage() {
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('totalRevenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    usersApi.getInstructorStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const courses: Course[] = stats?.courses ?? [];
  const sorted = [...courses].sort((a, b) => {
    const av = a[sortKey] as string | number;
    const bv = b[sortKey] as string | number;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc'
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-xs">
      {sortKey === col
        ? (sortDir === 'asc' ? '↑' : '↓')
        : <span className="text-ink-200">↕</span>}
    </span>
  );

  // Revenue summary values
  const totalRevenue  = stats?.totalRevenue  ?? 0;
  const thisMonth     = REVENUE_DATA[REVENUE_DATA.length - 1].revenue;
  const payoutPending = totalRevenue > 0 ? totalRevenue * 0.1 : 0; // placeholder 10%

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading">Instructor Dashboard</h1>
        <Link href="/dashboard/courses/create" className="btn-primary">
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {/* ── Revenue overview cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: DollarSign,
            label: 'Total Earned',
            value: formatUsdc(totalRevenue),
            suffix: 'USDC',
            sub: 'All time',
          },
          {
            icon: TrendingUp,
            label: 'This Month',
            value: formatUsdc(thisMonth),
            suffix: 'USDC',
            sub: 'December 2025',
          },
          {
            icon: ArrowUpRight,
            label: 'Payout Pending',
            value: formatUsdc(payoutPending),
            suffix: 'USDC',
            sub: 'Next payout: Jan 15',
          },
        ].map(({ icon: Icon, label, value, suffix, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-saffron-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-saffron-600" />
              </div>
              <p className="text-xs text-ink-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-ink-900">
              {loading ? (
                <span className="inline-block w-24 h-7 rounded-lg bg-ink-100 animate-pulse" />
              ) : (
                <>
                  {value}
                  <span className="text-xs font-normal text-ink-400 ml-1">{suffix}</span>
                </>
              )}
            </p>
            <p className="text-xs text-ink-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue bar chart ── */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-ink-900">
            Revenue — Last 12 Months
          </h2>
          <span className="text-xs text-ink-400">USDC</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={REVENUE_DATA}
            margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#8b7d6b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8b7d6b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#fffbeb' }} />
            <Bar
              dataKey="revenue"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Courses management table ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-ink-900">My courses</h2>
        {!loading && (
          <span className="text-xs text-ink-400">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        /* Loading skeleton */
        <div className="card overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-ink-100 last:border-0">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-ink-100 animate-pulse" />
                <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
              </div>
              <div className="h-4 w-16 rounded bg-ink-100 animate-pulse" />
              <div className="h-4 w-12 rounded bg-ink-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        /* Empty state */
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
        /* Course table */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50">
                  {/* Sortable: title */}
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide cursor-pointer select-none hover:text-ink-700 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    Course <SortIcon col="title" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    Status
                  </th>
                  {/* Sortable: students */}
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-ink-500 uppercase tracking-wide cursor-pointer select-none hover:text-ink-700 transition-colors"
                    onClick={() => handleSort('totalEnrollments')}
                  >
                    Students <SortIcon col="totalEnrollments" />
                  </th>
                  {/* Sortable: revenue */}
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-ink-500 uppercase tracking-wide cursor-pointer select-none hover:text-ink-700 transition-colors"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    Revenue <SortIcon col="totalRevenue" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {sorted.map((course, idx) => (
                  <tr key={course.id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink-900 line-clamp-1">{course.title}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{course.category}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={courseStatusBadge(course.status)}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-medium text-ink-900">
                        {(course.totalEnrollments ?? course._count?.enrollments ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-ink-900">
                        {course.totalRevenue > 0
                          ? `${formatUsdc(course.totalRevenue)} USDC`
                          : <span className="text-ink-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <EnrollmentSparkline data={trendSeed(idx * 5)} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="btn-ghost px-3 py-1.5 text-xs"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Preview
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${course.title}"?`)) {
                              console.log('Delete:', course.id);
                            }
                          }}
                          className="btn-danger px-3 py-1.5 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
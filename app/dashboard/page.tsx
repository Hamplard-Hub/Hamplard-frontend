'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, Clock, Award, ChevronRight,
  Home, Heart, MessageSquare, Settings, BarChart2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { enrollmentsApi } from '@/lib/api/services';
import { formatUsdc, cn } from '@/lib/utils';
import type { Enrollment } from '@/types';

// ── Placeholder data ──────────────────────────────────────────────
const RECOMMENDED = [
  { id: 'r1', title: 'Advanced Tailoring Techniques', category: 'Tailoring',    price: 49.99, emoji: '🧵' },
  { id: 'r2', title: 'Wedding Cake Masterclass',      category: 'Baking',       price: 39.99, emoji: '🍰' },
  { id: 'r3', title: 'Portrait Photography',          category: 'Photography',  price: 59.99, emoji: '📷' },
  { id: 'r4', title: 'Bridal Makeup Artistry',        category: 'Makeup',       price: 44.99, emoji: '💄' },
];

// ── Bottom tab nav items (mobile) ────────────────────────────────
const TABS = [
  { href: '/dashboard',          label: 'Home',     icon: Home },
  { href: '/dashboard/courses',  label: 'Courses',  icon: BookOpen },
  { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/notifications',      label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/account',  label: 'Account',  icon: Settings },
];

// ── Sidebar nav items (desktop) ──────────────────────────────────
const SIDEBAR_NAV = [
  { href: '/dashboard',                label: 'Home',             icon: Home },
  { href: '/dashboard/courses',        label: 'My Courses',       icon: BookOpen },
  { href: '/dashboard/wishlist',       label: 'Wishlist',         icon: Heart },
  { href: '/notifications',            label: 'Messages',         icon: MessageSquare },
  { href: '/dashboard/account',        label: 'Account Settings', icon: Settings },
];

// ── Quick stat card ───────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-saffron-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-saffron-600" />
      </div>
      <div>
        <p className="text-xl font-bold text-ink-900 leading-none">{value}</p>
        <p className="text-xs text-ink-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── In-progress course card ───────────────────────────────────────
function ContinueLearningCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course;
  const progress = enrollment.progressPercent ?? 0;

  return (
    <Link
      href={`/dashboard/courses/${course.id}/learn`}
      className="group flex-shrink-0 w-64 card overflow-hidden hover:shadow-lifted transition-shadow duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-saffron-100 to-saffron-200 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {course.category === 'Tailoring'       ? '🧵' :
             course.category === 'Baking'          ? '🍰' :
             course.category === 'Photography'     ? '📷' :
             course.category === 'Makeup Artistry' ? '💄' :
             course.category === 'Hairstyling'     ? '💇' : '🎓'}
          </div>
        )}
        {/* Progress overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-white/80 mt-1">{progress}% complete</p>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs text-saffron-600 font-medium mb-0.5">{course.category}</p>
        <p className="text-sm font-semibold text-ink-900 line-clamp-2 leading-snug">
          {course.title}
        </p>
        <p className="mt-2 text-xs font-medium text-hamplard-primary flex items-center gap-1">
          Continue <ChevronRight className="w-3 h-3" />
        </p>
      </div>
    </Link>
  );
}

// ── Recommended course card ───────────────────────────────────────
function RecommendedCard({
  course,
}: {
  course: { id: string; title: string; category: string; price: number; emoji: string };
}) {
  return (
    <div className="card overflow-hidden hover:shadow-lifted transition-shadow duration-200 flex-shrink-0 w-56">
      <div className="aspect-video bg-gradient-to-br from-saffron-50 to-saffron-100 flex items-center justify-center text-3xl">
        {course.emoji}
      </div>
      <div className="p-3">
        <p className="text-xs text-saffron-600 font-medium mb-0.5">{course.category}</p>
        <p className="text-sm font-semibold text-ink-900 line-clamp-2 leading-snug mb-2">
          {course.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink-900">
            {formatUsdc(course.price)}
            <span className="text-xs font-normal text-ink-400 ml-1">USDC</span>
          </span>
          <button className="btn-primary px-3 py-1.5 text-xs">Enroll</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const router  = useRouter();
  const { user, token, isConnected } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ── Route protection: redirect unauthenticated users ──
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem('hamplard_token')
      : null;
    if (!stored && !token) {
      router.replace('/auth/login');
    }
  }, [token, router]);

  // ── Fetch enrollments ──
  useEffect(() => {
    if (!token && !localStorage.getItem('hamplard_token')) return;
    enrollmentsApi.getMy()
      .then(res => setEnrollments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const inProgress   = enrollments.filter(e => e.progressPercent > 0 && e.progressPercent < 100);
  const allCourses   = enrollments;
  const certificates = enrollments.filter(e => e.status === 'COMPLETED').length;

  // Estimated hours (total lesson duration across enrollments)
  const hoursLearned = Math.round(
    enrollments.reduce((acc, e) => acc + (e.course?.totalDuration ?? 0), 0) / 3600,
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-56 flex-col flex-shrink-0 card rounded-2xl p-4 h-fit sticky top-6 self-start">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide px-2 mb-3">
          Navigation
        </p>
        <nav className="space-y-0.5">
          {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => {
            const active = typeof window !== 'undefined' && window.location.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-saffron-50 text-saffron-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                )}
              >
                <Icon className={cn('w-4 h-4', active ? 'text-saffron-600' : 'text-ink-400')} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="section-heading">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Pick up where you left off.
          </p>
        </div>

        {/* ── Quick stats bar ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard
            icon={BookOpen}
            label="Courses enrolled"
            value={loading ? '—' : allCourses.length}
          />
          <StatCard
            icon={Clock}
            label="Hours learned"
            value={loading ? '—' : hoursLearned}
          />
          <StatCard
            icon={Award}
            label="Certificates"
            value={loading ? '—' : certificates}
          />
        </div>

        {/* ── Continue Learning ── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-ink-900">
              Continue Learning
            </h2>
            <Link href="/dashboard/courses" className="text-xs text-saffron-600 font-medium hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            /* Loading skeleton */
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-64 card overflow-hidden">
                  <div className="aspect-video bg-ink-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-16 rounded bg-ink-100 animate-pulse" />
                    <div className="h-4 w-48 rounded bg-ink-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : inProgress.length === 0 ? (
            <div className="card p-8 text-center">
              <BookOpen className="w-8 h-8 text-saffron-200 mx-auto mb-2" />
              <p className="text-sm text-ink-500">No courses in progress yet.</p>
              <Link href="/dashboard/courses" className="btn-primary mt-3 inline-flex text-xs">
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {inProgress.map(e => (
                <ContinueLearningCard key={e.id} enrollment={e} />
              ))}
            </div>
          )}
        </section>

        {/* ── My Courses grid ── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-ink-900">
              My Courses
            </h2>
            <Link href="/dashboard/courses" className="text-xs text-saffron-600 font-medium hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="course-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-video bg-ink-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 rounded bg-ink-100 animate-pulse" />
                    <div className="h-4 w-full rounded bg-ink-100 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : allCourses.length === 0 ? (
            <div className="card p-10 text-center">
              <BookOpen className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-ink-700">No courses yet</p>
              <p className="text-xs text-ink-400 mt-1">
                Enroll in a course to start learning.
              </p>
              <Link href="/" className="btn-primary mt-4 inline-flex">
                Explore courses
              </Link>
            </div>
          ) : (
            <div className="course-grid">
              {allCourses.map(enrollment => {
                const course = enrollment.course;
                return (
                  <Link
                    key={enrollment.id}
                    href={`/dashboard/courses/${course.id}/learn`}
                    className="group block"
                  >
                    <div className="card overflow-hidden hover:shadow-lifted transition-shadow duration-200">
                      <div className="relative aspect-video bg-gradient-to-br from-saffron-100 to-saffron-200 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-4xl">
                            {course.category === 'Tailoring'       ? '🧵' :
                             course.category === 'Baking'          ? '🍰' :
                             course.category === 'Photography'     ? '📷' :
                             course.category === 'Makeup Artistry' ? '💄' : '🎓'}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-saffron-600 font-medium mb-1">
                          {course.category}
                        </p>
                        <p className="text-sm font-semibold text-ink-900 line-clamp-2 leading-snug mb-3">
                          {course.title}
                        </p>
                        <div className="progress-bar mb-1">
                          <div
                            className="progress-fill"
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-ink-400">
                          {enrollment.progressPercent}% complete
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Recommended courses carousel ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-ink-900">
              Recommended for You
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {RECOMMENDED.map(course => (
              <RecommendedCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-ink-100 z-50 flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = typeof window !== 'undefined' && window.location.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors',
                active ? 'text-saffron-600' : 'text-ink-400 hover:text-ink-700',
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-saffron-600' : 'text-ink-400')} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Clock,
  ChevronRight,
  Play,
  CheckCircle2,
  Archive,
  SortAsc,
  Filter,
} from 'lucide-react';
import { enrollmentsApi } from '@/lib/api/services';
import { CourseCardSkeleton } from '@/components/skeletons';
import { cn } from '@/lib/utils';
import type { Enrollment } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'in-progress' | 'completed' | 'archived';
type SortOption = 'recent' | 'title-az' | 'progress';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTabForEnrollment(e: Enrollment): FilterTab {
  if (e.status === 'REFUNDED') return 'archived';
  if (e.progressPercent >= 100 || e.status === 'COMPLETED') return 'completed';
  if (e.progressPercent > 0) return 'in-progress';
  return 'all';
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Tailoring: '🧵',
    Baking: '🍰',
    Photography: '📷',
    'Makeup Artistry': '💄',
    Hairstyling: '💇',
    'Nail Technology': '💅',
  };
  return map[category] ?? '🎓';
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={52} height={52} className="rotate-[-90deg]" aria-hidden>
      <circle cx={26} cy={26} r={r} fill="none" strokeWidth={4} className="stroke-ink-100" />
      <circle
        cx={26} cy={26} r={r} fill="none" strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-saffron-500 transition-all duration-700"
      />
    </svg>
  );
}

interface EnrolledCourseCardProps {
  enrollment: Enrollment;
}

function EnrolledCourseCard({ enrollment }: EnrolledCourseCardProps) {
  const { course, progressPercent, enrolledAt, status } = enrollment;
  const isCompleted = progressPercent >= 100 || status === 'COMPLETED';
  const isArchived  = status === 'REFUNDED';
  const continueHref = `/dashboard/courses/${course.id}/learn`;

  return (
    <article className={cn(
      'card overflow-hidden group hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-200',
      isArchived && 'opacity-60',
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-saffron-100 to-saffron-200 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">{getCategoryEmoji(course.category)}</span>
          </div>
        )}

        {/* Status overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-leaf-600" />
            </div>
          </div>
        )}

        {/* Progress ring */}
        {!isCompleted && !isArchived && (
          <div className="absolute bottom-2 right-2">
            <div className="relative">
              <ProgressRing percent={progressPercent} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ink-800 rotate-90">
                {progressPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-leaf-100 text-leaf-700">
            Completed
          </span>
        )}

        {/* Archived badge */}
        {isArchived && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-ink-100 text-ink-500 flex items-center gap-1">
            <Archive className="w-3 h-3" /> Archived
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-saffron-600 font-medium mb-1">{course.category}</p>
        <h3 className="text-sm font-semibold text-ink-900 mb-1 line-clamp-2 leading-snug">
          {course.title}
        </h3>
        <p className="text-xs text-ink-400 mb-3 truncate">
          {course.instructor?.name ?? 'Hamplard Instructor'}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-ink-400">{progressPercent}% complete</p>
            {enrollment.enrolledAt && (
              <p className="text-[10px] text-ink-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatRelativeDate(enrolledAt)}
              </p>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-3 border-t border-ink-100">
          {isArchived ? (
            <span className="text-xs text-ink-400 flex items-center gap-1">
              <Archive className="w-3 h-3" /> This enrollment has been refunded
            </span>
          ) : isCompleted ? (
            <Link
              href={continueHref}
              className="btn-secondary w-full justify-center text-xs py-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Review course
            </Link>
          ) : (
            <Link
              href={continueHref}
              className="btn-primary w-full justify-center text-xs py-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Continue learning
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Tab configuration ──────────────────────────────────────────────────────

const TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: 'all',         label: 'All Courses',  icon: BookOpen },
  { id: 'in-progress', label: 'In Progress',  icon: Play },
  { id: 'completed',   label: 'Completed',    icon: CheckCircle2 },
  { id: 'archived',    label: 'Archived',     icon: Archive },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'recent',   label: 'Recently Accessed' },
  { id: 'title-az', label: 'Title A–Z' },
  { id: 'progress', label: 'Progress' },
];

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ tab, hasSearch }: { tab: FilterTab; hasSearch: boolean }) {
  const messages: Record<FilterTab, { emoji: string; title: string; body: string }> = {
    all:          { emoji: '📚', title: 'No courses yet',       body: 'Browse the catalogue and start your learning journey.' },
    'in-progress':{ emoji: '▶️',  title: 'Nothing in progress', body: 'Start a course and your active learning will appear here.' },
    completed:    { emoji: '🏆', title: 'No completed courses', body: 'Keep going — your completed courses will show up here.' },
    archived:     { emoji: '📦', title: 'No archived courses',  body: 'Refunded or archived enrollments will appear here.' },
  };
  const { emoji, title, body } = messages[tab];
  return (
    <div className="card p-14 text-center col-span-full">
      <span className="text-5xl block mb-4">{emoji}</span>
      <p className="text-base font-semibold text-ink-900 mb-1">
        {hasSearch ? `No results for your search` : title}
      </p>
      <p className="text-sm text-ink-400 mb-6">
        {hasSearch ? 'Try a different keyword.' : body}
      </p>
      {!hasSearch && tab === 'all' && (
        <Link href="/" className="btn-primary inline-flex">
          Browse courses
        </Link>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<FilterTab>('all');
  const [sort, setSort]               = useState<SortOption>('recent');
  const [search, setSearch]           = useState('');
  const [showSort, setShowSort]       = useState(false);

  useEffect(() => {
    enrollmentsApi
      .getMy(1, 100)
      .then((r) => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Tab counts ────────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: 0, 'in-progress': 0, completed: 0, archived: 0 };
    enrollments.forEach((e) => {
      counts.all++;
      const tab = getTabForEnrollment(e);
      if (tab !== 'all') counts[tab]++;
    });
    return counts;
  }, [enrollments]);

  // ── Filtered + sorted list ────────────────────────────────────
  const visible = useMemo(() => {
    let list = enrollments.filter((e) => {
      const matchesSearch = e.course?.title?.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === 'all') return true;
      return getTabForEnrollment(e) === activeTab;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'title-az') return (a.course?.title ?? '').localeCompare(b.course?.title ?? '');
      if (sort === 'progress') return b.progressPercent - a.progressPercent;
      // recent: by enrolledAt (most recent first)
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });

    return list;
  }, [enrollments, search, activeTab, sort]);

  const selectedSortLabel = SORT_OPTIONS.find((s) => s.id === sort)?.label ?? 'Sort';

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="section-heading">My Courses</h1>
          {!loading && (
            <p className="text-sm text-ink-500 mt-0.5">
              {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
            </p>
          )}
        </div>
        <Link href="/" className="btn-secondary hidden sm:inline-flex">
          Browse more
        </Link>
      </div>

      {/* ── Search + Sort bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            id="my-courses-search"
            type="text"
            placeholder="Search my courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            disabled={loading}
            aria-label="Search enrolled courses"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            id="my-courses-sort-btn"
            type="button"
            onClick={() => setShowSort((v) => !v)}
            className="btn-secondary gap-2 text-sm"
            aria-expanded={showSort}
          >
            <SortAsc className="w-4 h-4" />
            <span className="hidden sm:inline">{selectedSortLabel}</span>
            <span className="sm:hidden">Sort</span>
          </button>
          {showSort && (
            <div
              className="absolute right-0 top-full mt-1.5 w-52 card p-1.5 z-20 shadow-lg"
              role="menu"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitem"
                  onClick={() => { setSort(opt.id); setShowSort(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                    sort === opt.id
                      ? 'bg-saffron-50 text-saffron-700 font-medium'
                      : 'text-ink-600 hover:bg-ink-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-0.5" role="tablist" aria-label="Course filter tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeTab === id
                ? 'bg-saffron-600 text-white shadow-sm'
                : 'text-ink-600 bg-white border border-ink-100 hover:border-saffron-200 hover:text-saffron-700',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {!loading && (
              <span className={cn(
                'ml-1 min-w-5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-center',
                activeTab === id ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500',
              )}>
                {id === 'all' ? tabCounts.all : tabCounts[id] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Course grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="course-grid" aria-live="polite" aria-label="Loading courses">
          {[1, 2, 3, 4, 5, 6].map((i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="course-grid">
          <EmptyState tab={activeTab} hasSearch={search.length > 0} />
        </div>
      ) : (
        <div className="course-grid" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {visible.map((e) => (
            <EnrolledCourseCard key={e.id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
}

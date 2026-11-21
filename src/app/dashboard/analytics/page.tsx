'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, Flame, Target, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '@/components/ui/EmptyState';
import { enrollmentsApi } from '@/lib/api/services';
import type { Enrollment } from '@/types';

interface MinutePoint {
  day: string;
  minutes: number;
}

interface CourseSummary {
  course: string;
  lessons: number;
}

const STORAGE_KEYS = {
  minutesPrefix: 'hamplard-daily-minutes-',
  streak: 'hamplard-streak-data',
  quizHistory: 'hamplard-quiz-history',
};

const getLast30Days = (): Array<{ key: string; label: string }> => {
  const days: Array<{ key: string; label: string }> = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    days.push({
      key,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return days;
};

const readMinutesByDay = (): MinutePoint[] => {
  if (typeof window === 'undefined') return [];

  const days = getLast30Days();
  return days.map(({ key, label }) => {
    const raw = window.localStorage.getItem(`${STORAGE_KEYS.minutesPrefix}${key}`);
    return {
      day: label,
      minutes: raw ? Number(raw) || 0 : 0,
    };
  });
};

const readQuizAverages = () => {
  if (typeof window === 'undefined') return { average: 0, count: 0 };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.quizHistory);
    if (!raw) return { average: 0, count: 0 };
    const entries = JSON.parse(raw) as Array<{ score: number; total: number }>;
    const totals = entries.filter((entry) => entry.total > 0);
    if (totals.length === 0) return { average: 0, count: 0 };
    const average = totals.reduce((sum, entry) => sum + (entry.score / entry.total) * 100, 0) / totals.length;
    return { average, count: totals.length };
  } catch {
    return { average: 0, count: 0 };
  }
};

const readBestStreak = () => {
  if (typeof window === 'undefined') return 0;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.streak);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { longestStreak?: number };
    return parsed.longestStreak ?? 0;
  } catch {
    return 0;
  }
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [minutesData, setMinutesData] = useState<MinutePoint[]>([]);
  const [courseBreakdown, setCourseBreakdown] = useState<CourseSummary[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await enrollmentsApi.getMy(1, 50);
        const enrollments = res.data || [];

        const summaries = enrollments
          .map((enrollment: Enrollment) => {
            const title = enrollment.course?.title ?? 'Course';
            const completed = enrollment.lessonProgress?.filter((item) => item.completed).length ?? 0;
            return { course: title, lessons: completed };
          })
          .filter((item) => item.lessons > 0)
          .sort((a, b) => b.lessons - a.lessons)
          .slice(0, 6);

        setCourseBreakdown(summaries);
        const localMinutes = readMinutesByDay();
        setMinutesData(localMinutes.some((item) => item.minutes > 0) ? localMinutes : []);
      } catch {
        setCourseBreakdown([]);
        setMinutesData([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const summary = useMemo(() => {
    const quiz = readQuizAverages();
    const bestStreak = readBestStreak();
    const totalMinutes = minutesData.reduce((sum, item) => sum + item.minutes, 0);
    const averageQuiz = quiz.count > 0 ? Math.round(quiz.average) : 0;

    return {
      minutes: totalMinutes,
      averageQuiz,
      bestStreak,
      courses: courseBreakdown.length,
    };
  }, [minutesData, courseBreakdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-sm text-ink-500">
          <Activity className="h-4 w-4 animate-pulse text-saffron-500" />
          Loading analytics…
        </div>
      </div>
    );
  }

  const hasAnalytics = minutesData.length > 0 || courseBreakdown.length > 0;

  if (!hasAnalytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="section-heading">Learning analytics</h1>
          <p className="mt-1 text-sm text-ink-500">Track your momentum across courses and quizzes.</p>
        </div>
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No analytics yet"
          description="Complete a few lessons and quiz attempts to unlock your progress insights."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Learning analytics</h1>
        <p className="mt-1 text-sm text-ink-500">See how consistently you are learning each week.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-saffron-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Minutes</span>
          </div>
          <p className="text-2xl font-bold text-ink-900">{summary.minutes}</p>
          <p className="mt-1 text-xs text-ink-500">Across the last 30 days</p>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-saffron-600">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Courses</span>
          </div>
          <p className="text-2xl font-bold text-ink-900">{summary.courses}</p>
          <p className="mt-1 text-xs text-ink-500">Active course tracks</p>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-saffron-600">
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Quiz avg</span>
          </div>
          <p className="text-2xl font-bold text-ink-900">{summary.averageQuiz}%</p>
          <p className="mt-1 text-xs text-ink-500">Across your recent attempts</p>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-saffron-600">
            <Flame className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Best streak</span>
          </div>
          <p className="text-2xl font-bold text-ink-900">{summary.bestStreak}</p>
          <p className="mt-1 text-xs text-ink-500">Consecutive learning days</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink-900">Minutes learned per day</h2>
            <p className="text-sm text-ink-500">Last 30 days</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={minutesData}>
                <defs>
                  <linearGradient id="minutesFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f7b731" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f7b731" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={5} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="minutes" stroke="#f7b731" strokeWidth={3} fill="url(#minutesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink-900">Lessons completed</h2>
            <p className="text-sm text-ink-500">By course</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseBreakdown} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="course"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="lessons" fill="#f7b731" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

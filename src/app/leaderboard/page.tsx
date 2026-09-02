'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { leaderboardApi } from '@/lib/api/services';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { Breadcrumb } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from '@/types';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'week',  label: 'This Week'  },
  { value: 'month', label: 'This Month' },
  { value: 'all',   label: 'All Time'   },
];

export default function LeaderboardPage() {
  const { user } = useAuthStore();

  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [data, setData]     = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    leaderboardApi
      .get(period)
      .then(setData)
      .catch(() => setError('Failed to load leaderboard. Please try again.'))
      .finally(() => setLoading(false));
  }, [period]);

  // Derive current-user entry from API response or inject a placeholder
  const currentUserEntry: LeaderboardEntry | null =
    data?.currentUser ??
    (user
      ? {
          rank: (data?.entries.length ?? 0) + 1,
          userId: user.id,
          name: user.name ?? user.email ?? 'You',
          avatarUrl: user.avatarUrl ?? null,
          coursesCompleted: 0,
          hoursLearned: 0,
          streakDays: 0,
        }
      : null);

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Leaderboard' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-saffron-500" aria-hidden="true" />
              <h1 className="section-heading">Leaderboard</h1>
            </div>
            <p className="text-sm text-ink-500">
              Top students ranked by courses completed, learning hours, and streak.
            </p>
          </div>

          {/* Period tab switcher */}
          <div
            role="tablist"
            aria-label="Time period"
            className="flex gap-1 rounded-xl border border-ink-100 bg-white p-1 shadow-sm"
          >
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                type="button"
                aria-selected={period === value}
                onClick={() => setPeriod(value)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  period === value
                    ? 'bg-saffron-500 text-white shadow-sm'
                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Top-3 podium summary (decorative) */}
        {!loading && data && data.entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {/* 2nd */}
            <PodiumCard entry={data.entries[1]} position={2} />
            {/* 1st — taller */}
            <PodiumCard entry={data.entries[0]} position={1} featured />
            {/* 3rd */}
            <PodiumCard entry={data.entries[2]} position={3} />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-6 w-6 animate-spin text-saffron-500"
              aria-label="Loading leaderboard"
            />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              className="btn-secondary mt-4 text-sm"
              onClick={() => setPeriod((p) => p)}
            >
              Retry
            </button>
          </div>
        ) : (
          <LeaderboardTable
            entries={data?.entries ?? []}
            currentUserId={user?.id ?? null}
            currentUserEntry={currentUserEntry}
          />
        )}

        <p className="text-center text-xs text-ink-400">
          Rankings update every hour · Keep learning to climb the board 🚀
        </p>
      </div>
    </div>
  );
}

// ── Podium card ────────────────────────────────────────────────────────────
const PODIUM_MEDAL = ['🥇', '🥈', '🥉'] as const;
const PODIUM_BG = [
  'from-amber-50 to-amber-100 border-amber-200',
  'from-slate-50 to-slate-100 border-slate-200',
  'from-orange-50 to-orange-100 border-orange-200',
];

function PodiumCard({
  entry,
  position,
  featured = false,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  featured?: boolean;
}) {
  const initials = (entry.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b px-3 py-4 text-center transition-all',
        PODIUM_BG[position - 1],
        featured ? 'scale-105 shadow-md' : 'shadow-sm',
      )}
    >
      <span className="text-2xl leading-none" role="img" aria-label={`Position ${position}`}>
        {PODIUM_MEDAL[position - 1]}
      </span>

      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.name ?? 'Student'}
          className={cn(
            'rounded-full object-cover',
            featured ? 'h-12 w-12' : 'h-10 w-10',
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-white font-bold text-saffron-700',
            featured ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs',
          )}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      <p className="w-full truncate text-xs font-semibold text-ink-900">
        {entry.name ?? 'Anonymous'}
      </p>
      <p className="text-[11px] text-ink-500">
        {entry.coursesCompleted} course{entry.coursesCompleted !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

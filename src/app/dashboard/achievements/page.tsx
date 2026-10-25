'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Award, Trophy, Sparkles, Filter, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import { achievementsApi } from '@/lib/api/services';
import type { Achievement } from '@/types';
import { BadgeCard } from '@/components/dashboard/BadgeCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/lib/hooks/use-toast';

type FilterTab = 'all' | 'earned' | 'locked';
type CategoryFilter = 'all' | 'learning' | 'streak' | 'certificates' | 'community';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const toast = useToast();

  const loadAchievements = async () => {
    try {
      const data = await achievementsApi.getAll();
      setAchievements(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();

    // Listen for new badge awards
    const handleEarned = (e: Event) => {
      const customEvent = e as CustomEvent<Achievement>;
      if (customEvent.detail) {
        toast.success({
          title: '🎉 Achievement Unlocked!',
          description: `You've earned the "${customEvent.detail.title}" badge!`,
        });
        loadAchievements();
      }
    };

    window.addEventListener('hamplard:achievement-earned', handleEarned);
    return () => window.removeEventListener('hamplard:achievement-earned', handleEarned);
  }, []);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length || 1;
  const progressPercent = Math.round((earnedCount / totalCount) * 100);

  const filteredBadges = useMemo(() => {
    return achievements.filter((badge) => {
      if (activeTab === 'earned' && !badge.earned) return false;
      if (activeTab === 'locked' && badge.earned) return false;
      if (categoryFilter !== 'all' && badge.category !== categoryFilter) return false;
      return true;
    });
  }, [achievements, activeTab, categoryFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-500 mb-6" aria-label="Breadcrumbs">
        <Link href="/dashboard" className="hover:text-ink-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
        <span className="font-medium text-ink-900">Achievements & Badges</span>
      </nav>

      {/* Header Banner */}
      <div className="card p-6 sm:p-8 mb-8 bg-gradient-to-br from-white via-saffron-50/40 to-amber-50/30 border-ink-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-saffron-100/80 text-saffron-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Milestones & Rewards
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink-900">
            Achievements & Badges
          </h1>
          <p className="text-sm text-ink-600 mt-2 max-w-xl leading-relaxed">
            Track your milestones as you advance your vocational skills. Earn distinct badges for
            learning streaks, completed assignments, and verifiable certificates.
          </p>
        </div>

        {/* Progress Summary Card */}
        <div className="shrink-0 bg-white/90 p-5 rounded-2xl border border-ink-100 shadow-xs min-w-[240px]">
          <div className="flex items-center justify-between text-xs text-ink-600 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-saffron-500" />
              Badge Progress
            </span>
            <span className="font-bold text-ink-900">
              {earnedCount} / {totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-ink-100 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-gradient-to-r from-saffron-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-ink-400 text-right">{progressPercent}% unlocked</p>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-ink-100">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-ink-100/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-ink-900 shadow-xs'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            All Badges ({achievements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earned')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'earned'
                ? 'bg-white text-leaf-700 shadow-xs'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Earned ({earnedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locked')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'locked'
                ? 'bg-white text-ink-900 shadow-xs'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Locked ({totalCount - earnedCount})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-ink-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="input text-xs py-1.5 pr-8"
            aria-label="Filter badges by category"
          >
            <option value="all">All Categories</option>
            <option value="learning">Course & Lessons</option>
            <option value="streak">Streaks & Consistency</option>
            <option value="certificates">Certificates</option>
            <option value="community">Community & Crafts</option>
          </select>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-16 h-16 bg-ink-200 rounded-2xl mx-auto my-3" />
              <div className="h-4 bg-ink-200 rounded w-24 mx-auto mb-2" />
              <div className="h-3 bg-ink-100 rounded w-36 mx-auto" />
            </div>
          ))}
        </div>
      ) : filteredBadges.length === 0 ? (
        <div className="my-6">
          <EmptyState
            icon={<Award className="w-6 h-6" />}
            title="No badges found"
            description="Try adjusting your status or category filters above."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}

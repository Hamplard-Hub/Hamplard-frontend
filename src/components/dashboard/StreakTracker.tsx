'use client';

import React, { useEffect, useState } from 'react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  activityDays: string[];
}

const STORAGE_KEY = 'hamplard-streak-data';
const MIN_SESSION_MINUTES = 5;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDayDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function loadStreakData(): StreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, activityDays: [] };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, activityDays: [] };
  }
  try {
    return JSON.parse(raw) as StreakData;
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, activityDays: [] };
  }
}

function saveStreakData(data: StreakData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function computeStreak(data: StreakData, today: string): StreakData {
  if (!data.lastActiveDate) return data;

  const daysSinceLastActive = getDayDifference(data.lastActiveDate, today);

  if (daysSinceLastActive === 0) return data;

  if (daysSinceLastActive === 1) {
    const currentStreak = data.currentStreak + 1;
    const longestStreak = Math.max(data.longestStreak, currentStreak);
    const activityDays = data.activityDays.includes(today)
      ? data.activityDays
      : [...data.activityDays, today];
    return { ...data, currentStreak, longestStreak, lastActiveDate: today, activityDays };
  }

  return { ...data, currentStreak: 0, lastActiveDate: today };
}

export function recordLearningSession(minutes: number) {
  if (minutes < MIN_SESSION_MINUTES) return;

  const today = getTodayKey();
  const data = loadStreakData();

  let updated: StreakData;
  if (!data.lastActiveDate) {
    updated = { currentStreak: 1, longestStreak: 1, lastActiveDate: today, activityDays: [today] };
  } else if (data.lastActiveDate === today) {
    updated = data;
  } else {
    updated = computeStreak(data, today);
  }

  saveStreakData(updated);
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function StreakTracker() {
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreakData());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = getTodayKey();
    const updated = computeStreak(loadStreakData(), today);
    setStreakData(updated);
    saveStreakData(updated);
  }, []);

  if (!mounted) return null;

  const last7Days = getLast7Days();
  const isActiveToday = streakData.lastActiveDate === getTodayKey();
  const isBroken = !isActiveToday && streakData.currentStreak === 0;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold mb-3">Learning Streak</h3>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" role="img" aria-label="flame">🔥</span>
        <span className="text-2xl font-bold">{streakData.currentStreak}</span>
        <span className="text-sm text-ink-500">
          {streakData.currentStreak === 1 ? 'day' : 'days'}
        </span>
      </div>

      <p className="text-xs text-ink-500 mb-3">
        Longest streak: {streakData.longestStreak} day{streakData.longestStreak !== 1 ? 's' : ''}
      </p>

      {isBroken && (
        <p className="text-xs text-hamplard-primary font-medium mb-3">
          Start a new streak today
        </p>
      )}

      <div className="flex gap-1">
        {last7Days.map((day) => {
          const isActive = streakData.activityDays.includes(day);
          const isToday = day === getTodayKey();
          return (
            <div
              key={day}
              className={`h-6 w-6 rounded ${isActive ? 'bg-hamplard-primary' : 'bg-ink-100'} ${isToday ? 'ring-2 ring-hamplard-primary/50' : ''}`}
              title={day}
            />
          );
        })}
      </div>
    </div>
  );
}

export default StreakTracker;

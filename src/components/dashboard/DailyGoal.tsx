'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Target, CheckCircle, Sparkles, Clock, Award } from 'lucide-react';

export const GOAL_OPTIONS = [5, 15, 30, 60] as const;
export type GoalMinutes = (typeof GOAL_OPTIONS)[number];

const GOAL_STORAGE_KEY = 'hamplard-daily-goal-minutes';
const MINUTES_STORAGE_KEY_PREFIX = 'hamplard-daily-minutes-';

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyGoal(): GoalMinutes {
  if (typeof window === 'undefined') return 15;
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 15;
    return (GOAL_OPTIONS.includes(parsed as GoalMinutes) ? parsed : 15) as GoalMinutes;
  } catch {
    return 15;
  }
}

export function setDailyGoal(minutes: GoalMinutes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, String(minutes));
    window.dispatchEvent(new CustomEvent('hamplard:goal-updated'));
  } catch {
    // Storage unavailable
  }
}

export function getTodayMinutes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const today = getTodayKey();
    const raw = localStorage.getItem(`${MINUTES_STORAGE_KEY_PREFIX}${today}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export function addLearningMinutes(minutes: number): number {
  if (typeof window === 'undefined') return 0;
  try {
    const today = getTodayKey();
    const current = getTodayMinutes();
    const next = current + Math.max(0, minutes);
    localStorage.setItem(`${MINUTES_STORAGE_KEY_PREFIX}${today}`, String(next));
    window.dispatchEvent(new CustomEvent('hamplard:goal-updated'));
    return next;
  } catch {
    return 0;
  }
}

interface DailyGoalProps {
  className?: string;
  onGoalCompleted?: () => void;
}

export function DailyGoal({ className = '', onGoalCompleted }: DailyGoalProps) {
  const [goal, setGoal] = useState<GoalMinutes>(15);
  const [todayMinutes, setTodayMinutes] = useState<number>(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const syncState = useCallback(() => {
    setGoal(getDailyGoal());
    setTodayMinutes(getTodayMinutes());
  }, []);

  useEffect(() => {
    setMounted(true);
    syncState();

    // Check reduced motion
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.('change', listener);
      return () => mediaQuery.removeEventListener?.('change', listener);
    }
  }, [syncState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdate = () => syncState();
    window.addEventListener('hamplard:goal-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('hamplard:goal-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [syncState]);

  const percent = Math.min(100, Math.round((todayMinutes / goal) * 100));
  const isGoalMet = todayMinutes >= goal;

  // Trigger celebration once when goal is met
  useEffect(() => {
    if (isGoalMet && !hasCelebrated && mounted) {
      setHasCelebrated(true);
      onGoalCompleted?.();
    }
  }, [isGoalMet, hasCelebrated, mounted, onGoalCompleted]);

  const handleSelectGoal = (newGoal: GoalMinutes) => {
    setDailyGoal(newGoal);
    setGoal(newGoal);
    setIsPickerOpen(false);
  };

  if (!mounted) return null;

  // Ring dimension calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={`card p-4 relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-saffron-50 text-saffron-600">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-ink-900">Daily Learning Goal</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="text-xs font-medium text-saffron-600 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 px-2 py-1 rounded-md transition-colors"
          aria-expanded={isPickerOpen}
          aria-label="Change daily goal"
        >
          {goal} min/day
        </button>
      </div>

      {/* Goal Selector Dropdown / Pills */}
      {isPickerOpen && (
        <div className="mb-4 p-3 bg-ink-50 rounded-xl border border-ink-100 animate-fadeIn">
          <p className="text-xs text-ink-600 mb-2 font-medium">Select your daily commitment:</p>
          <div className="grid grid-cols-4 gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectGoal(opt)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${
                  goal === opt
                    ? 'bg-hamplard-primary text-white shadow-sm'
                    : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-100'
                }`}
              >
                {opt}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress ring & Stats */}
      <div className="flex items-center gap-4">
        {/* SVG Circular Progress Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            {/* Background Track */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-ink-100"
            />
            {/* Progress Arc */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-700 ${
                isGoalMet ? 'text-leaf-500' : 'text-hamplard-primary'
              }`}
            />
          </svg>

          {/* Centered Ring Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isGoalMet ? (
              <CheckCircle className="w-6 h-6 text-leaf-500 animate-scaleIn" />
            ) : (
              <>
                <span className="text-base font-bold text-ink-900 leading-none">{percent}%</span>
                <span className="text-[10px] text-ink-400 mt-0.5">done</span>
              </>
            )}
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-ink-900">{todayMinutes}</span>
            <span className="text-xs text-ink-500">/ {goal} mins today</span>
          </div>

          <p className="text-xs text-ink-500 mt-1">
            {isGoalMet ? (
              <span className="text-leaf-600 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Goal achieved! Great job!
              </span>
            ) : (
              `${Math.max(0, goal - todayMinutes)} minutes remaining to reach today's target`
            )}
          </p>

          {/* Quick simulator/logging button for demo/manual entry */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => addLearningMinutes(5)}
              aria-label="Add 5 minutes of study"
              className="text-[11px] text-ink-600 hover:text-ink-900 bg-white border border-ink-200 px-2 py-0.5 rounded hover:bg-ink-50 transition-colors flex items-center gap-1"
              title="Add 5 minutes of study"
            >
              <Clock className="w-3 h-3 text-ink-400" />
              +5m
            </button>
            <button
              type="button"
              onClick={() => addLearningMinutes(15)}
              aria-label="Add 15 minutes of study"
              className="text-[11px] text-ink-600 hover:text-ink-900 bg-white border border-ink-200 px-2 py-0.5 rounded hover:bg-ink-50 transition-colors flex items-center gap-1"
              title="Add 15 minutes of study"
            >
              +15m
            </button>
          </div>
        </div>
      </div>

      {/* Celebration Banner when goal is met */}
      {isGoalMet && (
        <div
          className={`mt-3 pt-3 border-t border-leaf-100 flex items-center justify-between text-xs text-leaf-800 bg-leaf-50/60 -mx-4 -mb-4 px-4 py-2.5 ${
            prefersReducedMotion ? '' : 'transition-opacity duration-500 animate-fadeIn'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-leaf-600 shrink-0" />
            <span className="font-semibold">Daily goal completed! Keep the momentum going!</span>
          </div>
          <span className="text-base" role="img" aria-label="party popper">
            🎉
          </span>
        </div>
      )}
    </div>
  );
}

export default DailyGoal;

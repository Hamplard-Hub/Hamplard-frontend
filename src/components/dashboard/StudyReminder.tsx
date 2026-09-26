'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Bell, BellOff, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
type DayAbbrev = (typeof DAYS)[number];

interface ReminderSchedule {
  enabled: boolean;
  days: DayAbbrev[];
  time: string;          // "HH:mm" 24-hour
  message: string;
}

const STORAGE_KEY = 'hamplard_study_reminder';
const DEFAULT_MESSAGE = "Time to learn! Open Hamplard and continue your course.";

const DEFAULT_SCHEDULE: ReminderSchedule = {
  enabled: false,
  days: ['Mon', 'Wed', 'Fri'],
  time: '09:00',
  message: DEFAULT_MESSAGE,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function loadSchedule(): ReminderSchedule {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SCHEDULE, ...(JSON.parse(raw) as Partial<ReminderSchedule>) } : DEFAULT_SCHEDULE;
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

function saveSchedule(s: ReminderSchedule) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
}

/**
 * Returns ms until the next occurrence of `time` on one of `days`.
 * Returns null if no days are selected.
 */
function msUntilNext(days: DayAbbrev[], time: string): number | null {
  if (days.length === 0) return null;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  const now = new Date();
  // Check today through the next 7 days
  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(h, m, 0, 0);

    const dayAbbrev = DAYS[candidate.getDay()];
    if (days.includes(dayAbbrev) && candidate.getTime() > now.getTime()) {
      return candidate.getTime() - now.getTime();
    }
  }
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function StudyReminder() {
  const toast = useToast();

  const [schedule, setSchedule] = useState<ReminderSchedule>(DEFAULT_SCHEDULE);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [saved, setSaved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate from localStorage ──────────────────────────────────────────
  useEffect(() => {
    setSchedule(loadSchedule());
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // ── Fire reminder logic ────────────────────────────────────────────────
  const fireReminder = useCallback(
    (msg: string) => {
      if (notifPermission === 'granted' && 'Notification' in window) {
        new Notification('Hamplard Study Reminder 🎓', {
          body: msg,
          icon: '/hamplard-og.svg',
        });
      } else {
        toast.info({ title: 'Study Reminder 🎓', description: msg, duration: 8000 });
      }
    },
    [notifPermission, toast],
  );

  const scheduleNext = useCallback(
    (s: ReminderSchedule) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!s.enabled || s.days.length === 0) return;

      const ms = msUntilNext(s.days, s.time);
      if (ms === null) return;

      timerRef.current = setTimeout(() => {
        fireReminder(s.message || DEFAULT_MESSAGE);
        // Re-schedule for the next occurrence after firing
        scheduleNext(s);
      }, ms);
    },
    [fireReminder],
  );

  // Re-schedule whenever saved schedule changes
  useEffect(() => {
    const stored = loadSchedule();
    if (stored.enabled) scheduleNext(stored);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleDay = (day: DayAbbrev) => {
    setSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === 'denied') {
      toast.warning({
        title: 'Notifications blocked',
        description: 'We\'ll show on-screen toasts instead when your reminder fires.',
      });
    }
  };

  const handleSave = async () => {
    // Request permission on first save if not yet decided
    if (schedule.enabled && notifPermission === 'default') {
      await requestPermission();
    }

    saveSchedule(schedule);
    scheduleNext(schedule);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    toast.success({
      title: 'Reminder saved',
      description: schedule.enabled
        ? `You'll be reminded on ${schedule.days.join(', ')} at ${schedule.time}.`
        : 'Study reminders are turned off.',
    });
  };

  const notifBlocked = 'Notification' in window && notifPermission === 'denied';

  return (
    <section className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-saffron-600" aria-hidden="true" />
          <h2 className="font-semibold text-ink-900">Study reminders</h2>
        </div>

        {/* Enable toggle */}
        <label className="relative inline-flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            className="sr-only"
            checked={schedule.enabled}
            onChange={(e) =>
              setSchedule((prev) => ({ ...prev, enabled: e.target.checked }))
            }
            aria-label="Enable study reminders"
          />
          <div
            className={cn(
              'h-5 w-9 rounded-full transition-colors',
              schedule.enabled ? 'bg-saffron-500' : 'bg-ink-200',
            )}
          >
            <div
              className={cn(
                'h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform',
                schedule.enabled ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </div>
          <span className="text-sm text-ink-600">
            {schedule.enabled ? 'On' : 'Off'}
          </span>
        </label>
      </div>

      {/* Notification permission warning */}
      {notifBlocked && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Browser notifications are blocked. Reminders will show as on-screen toasts instead.
        </div>
      )}

      {notifPermission === 'default' && schedule.enabled && (
        <div className="flex items-start gap-2 rounded-xl border border-[#D5D2F6] bg-[#F4F2FF] px-3 py-2.5 text-xs text-[#3C3489]">
          <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Allow browser notifications for the best experience.{' '}
            <button
              type="button"
              onClick={requestPermission}
              className="font-semibold underline underline-offset-2 hover:no-underline"
            >
              Grant permission
            </button>
          </span>
        </div>
      )}

      <div
        className={cn(
          'space-y-5 transition-opacity',
          !schedule.enabled && 'pointer-events-none opacity-40',
        )}
        aria-disabled={!schedule.enabled}
      >
        {/* Days of week */}
        <div>
          <p className="label mb-2">Days</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Reminder days">
            {DAYS.map((day) => {
              const selected = schedule.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={selected}
                  className={cn(
                    'h-9 w-11 rounded-xl text-xs font-semibold transition-all',
                    selected
                      ? 'bg-saffron-500 text-white shadow-sm'
                      : 'border border-ink-200 bg-white text-ink-600 hover:border-saffron-300 hover:text-saffron-700',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time picker */}
        <div>
          <label htmlFor="reminder-time" className="label">
            Time
          </label>
          <input
            id="reminder-time"
            type="time"
            value={schedule.time}
            onChange={(e) => setSchedule((prev) => ({ ...prev, time: e.target.value }))}
            className="input w-auto"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="reminder-message" className="label">
            Reminder message{' '}
            <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="reminder-message"
            rows={2}
            maxLength={140}
            placeholder={DEFAULT_MESSAGE}
            value={schedule.message}
            onChange={(e) => setSchedule((prev) => ({ ...prev, message: e.target.value }))}
            className="textarea"
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {schedule.message.length}/140 characters
          </p>
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        className="btn-primary inline-flex items-center gap-2 text-sm"
      >
        {saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save reminder
          </>
        )}
      </button>
    </section>
  );
}

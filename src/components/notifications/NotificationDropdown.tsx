'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';
import { isToday } from 'date-fns';
import { useNotificationStore } from '@/lib/hooks/use-notification-store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map notification type → destination URL for click-through navigation. */
function notificationHref(n: Notification): string {
  const d = n.data ?? {};
  switch (n.type) {
    case 'ENROLLMENT_CONFIRMED':
    case 'COURSE_COMPLETED':
      return d.courseId ? `/dashboard/courses/${d.courseId}/learn` : '/dashboard/courses';
    case 'CERTIFICATE_ISSUED':
      return d.certificateId
        ? `/certificates/${d.certificateId}`
        : '/dashboard/certificates';
    case 'COURSE_APPROVED':
    case 'COURSE_REJECTED':
    case 'NEW_ENROLLMENT':
      return d.courseId ? `/dashboard/courses/${d.courseId}` : '/dashboard/instructor';
    case 'ASSIGNMENT_SUBMITTED':
    case 'ASSIGNMENT_APPROVED':
    case 'ASSIGNMENT_REJECTED':
      return '/dashboard/courses';
    case 'PAYMENT_RECEIVED':
      return '/dashboard/instructor';
    default:
      return '/notifications';
  }
}

/** Two-letter avatar initials derived from the notification title. */
function initials(title: string): string {
  return title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Avatar background colour cycled by notification type. */
const TYPE_AVATAR_BG: Record<string, string> = {
  COURSE_APPROVED:      'bg-leaf-500',
  COURSE_REJECTED:      'bg-red-500',
  ENROLLMENT_CONFIRMED: 'bg-saffron-500',
  COURSE_COMPLETED:     'bg-leaf-500',
  CERTIFICATE_ISSUED:   'bg-saffron-500',
  ASSIGNMENT_APPROVED:  'bg-leaf-500',
  ASSIGNMENT_REJECTED:  'bg-red-500',
  ASSIGNMENT_SUBMITTED: 'bg-blue-500',
  PAYMENT_RECEIVED:     'bg-leaf-500',
  NEW_ENROLLMENT:       'bg-saffron-500',
};

// ─── Sub-component: single notification row ───────────────────────────────────

interface NotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function NotificationRow({ notification: n, onRead }: NotificationRowProps) {
  const router = useRouter();
  const href = notificationHref(n);
  const avatarBg = TYPE_AVATAR_BG[n.type] ?? 'bg-hamplard-primary';

  function handleClick() {
    if (!n.read) onRead(n.id);
    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset',
        n.read
          ? 'opacity-70 hover:bg-white/5'
          : 'hover:bg-white/10',
      )}
      aria-label={n.read ? n.title : `Unread: ${n.title}`}
    >
      {/* Avatar */}
      <span
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
          avatarBg,
        )}
        aria-hidden="true"
      >
        {initials(n.title)}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            n.read ? 'text-white/70' : 'font-medium text-white',
          )}
        >
          {n.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-white/50">
          {n.message}
        </p>
        <p className="mt-1 text-[10px] text-white/40">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span
          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-hamplard-primary"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);

  const { notifications, loading, fetched, fetchNotifications, markRead, markAllRead } =
    useNotificationStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Fetch on first open ────────────────────────────────────────────────────
  useEffect(() => {
    if (open && !fetched) {
      fetchNotifications();
    }
  }, [open, fetched, fetchNotifications]);

  // ── Outside click ──────────────────────────────────────────────────────────
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // ── Group by date ──────────────────────────────────────────────────────────
  const todayItems    = notifications.filter((n) => isToday(new Date(n.createdAt)));
  const earlierItems  = notifications.filter((n) => !isToday(new Date(n.createdAt)));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      {/* ── Bell trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
        aria-label={
          unreadCount > 0
            ? `Notifications — ${unreadCount} unread`
            : 'Notifications'
        }
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-hamplard-primary text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className={cn(
            'absolute right-0 top-full mt-2 w-80 sm:w-96',
            'rounded-xl border border-white/10 bg-[#26215C] shadow-lg',
            'overflow-hidden animate-fade-in',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              /* Loading state */
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-hamplard-primary" />
              </div>
            ) : notifications.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <Bell className="h-8 w-8 text-white/20" />
                <p className="text-sm text-white/50">You're all caught up!</p>
                <p className="text-xs text-white/30">No notifications yet.</p>
              </div>
            ) : (
              <>
                {/* Today */}
                {todayItems.length > 0 && (
                  <section aria-label="Today's notifications">
                    <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      Today
                    </p>
                    {todayItems.map((n) => (
                      <NotificationRow key={n.id} notification={n} onRead={markRead} />
                    ))}
                  </section>
                )}

                {/* Earlier */}
                {earlierItems.length > 0 && (
                  <section aria-label="Earlier notifications">
                    <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      Earlier
                    </p>
                    {earlierItems.map((n) => (
                      <NotificationRow key={n.id} notification={n} onRead={markRead} />
                    ))}
                  </section>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-hamplard-primary transition-colors hover:text-white focus:outline-none focus-visible:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

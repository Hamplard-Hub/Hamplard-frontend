'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, BookOpen, Heart, User, Bell } from 'lucide-react';
import { useNotificationStore } from '@/lib/hooks/use-notification-store';

export function BottomTabs() {
  const unreadCount = useNotificationStore((state) =>
    state.notifications.filter((notification) => !notification.read).length,
  );
  const fetched = useNotificationStore((state) => state.fetched);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (!fetched) void fetchNotifications();

    const refreshNotifications = () => void fetchNotifications();
    window.addEventListener('hamplard:notifications-updated', refreshNotifications);
    return () => window.removeEventListener('hamplard:notifications-updated', refreshNotifications);
  }, [fetched, fetchNotifications]);

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 md:hidden flex justify-around py-2">
      <Link href="/dashboard/home" className="flex flex-col items-center text-xs text-ink-600">
        <Home className="w-5 h-5" />
        Home
      </Link>
      <Link href="/dashboard/courses" className="flex flex-col items-center text-xs text-ink-600">
        <BookOpen className="w-5 h-5" />
        Courses
      </Link>
      <Link href="/wishlist" className="flex flex-col items-center text-xs text-ink-600">
        <Heart className="w-5 h-5" />
        Wishlist
      </Link>
      <Link
        href="/notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="flex flex-col items-center text-xs text-ink-600"
      >
        <span className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-hamplard-primary px-1 text-[10px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        Notifications
      </Link>
      <Link href="/account" className="flex flex-col items-center text-xs text-ink-600">
        <User className="w-5 h-5" />
        Account
      </Link>
    </nav>
  );
}

export default BottomTabs;

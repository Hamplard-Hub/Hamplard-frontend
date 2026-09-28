'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen,
  Video,
  BarChart2,
  Bell,
  Award,
  Heart,
  LogOut,
  User,
  Settings,
  Trophy,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { useWishlistCount } from '@/lib/hooks/use-wishlist-store';
import { shortAddress, cn } from '@/lib/utils';
import { ProfileCompletion } from '@/components/dashboard/ProfileCompletion';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Renders the saved-course count alongside the label. */
  showWishlistCount?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard/my-courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/progress', label: 'Progress', icon: BarChart2 },
  { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart, showWishlistCount: true },
  { href: '/dashboard/certificates', label: 'Certificates', icon: Award },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

const INSTRUCTOR_NAV = [
  { href: '/dashboard/instructor', label: 'Dashboard', icon: BarChart2 },
  { href: '/dashboard/instructor/courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/courses/create', label: 'New Course', icon: Video },
  { href: '/dashboard/instructor/announcements', label: 'Announcements', icon: Bell },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const { user, address, logout } = useAuthStore();
  const wishlistCount = useWishlistCount();
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const nav = isInstructor ? INSTRUCTOR_NAV : STUDENT_NAV;

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Keep the control usable when storage is unavailable.
      }
      return next;
    });
  };

  return (
    <aside className={cn(
      'relative hidden flex-shrink-0 flex-col overflow-hidden border-r border-ink-100 bg-white transition-[width] duration-300 ease-in-out lg:flex',
      collapsed ? 'w-20' : 'w-60',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-ink-100 py-5',
        collapsed ? 'justify-center px-2' : 'justify-between px-5',
      )}>
        <Link href="/" aria-label="Hamplard" className="font-display text-xl font-semibold text-ink-900">
          {collapsed ? 'H' : 'Hamplard'}
        </Link>
        {!collapsed && isInstructor && (
          <span className="ml-2 text-[10px] font-medium text-saffron-600 bg-saffron-50 px-1.5 py-0.5 rounded-md">
            Instructor
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute right-2 top-[1.125rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:bg-ink-50 hover:text-ink-700"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Navigation */}
      <nav className={cn('flex-1 py-4 space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
        {nav.map(({ href, label, icon: Icon, showWishlistCount }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center rounded-xl py-2.5 text-sm font-medium transition-all',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
              active
                ? 'bg-saffron-50 text-saffron-700'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined}>
              <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-saffron-600' : 'text-ink-400')} />
              {!collapsed && label}
              {!collapsed && showWishlistCount && wishlistCount > 0 && (
                <span
                  className="ml-auto min-w-5 px-1.5 py-0.5 rounded-full bg-saffron-100 text-saffron-700 text-[10px] font-semibold text-center"
                  aria-label={`${wishlistCount} saved course${wishlistCount !== 1 ? 's' : ''}`}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-ink-100 py-4', collapsed ? 'px-2' : 'px-3')}>
        <div className={cn(
          'mb-2 flex items-center rounded-xl bg-ink-50 py-2',
          collapsed ? 'justify-center px-1' : 'gap-2.5 px-3',
        )}>
          <div className="w-7 h-7 rounded-full bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-saffron-700">
              {(user?.name ?? address ?? 'G').slice(0, 1).toUpperCase()}
            </span>
          </div>
          {!collapsed && <div className="min-w-0">
            <p className="text-xs font-medium text-ink-900 truncate">
              {user?.name ?? shortAddress(address ?? '')}
            </p>
            <p className="text-[10px] text-ink-400 capitalize">
              {user?.role?.toLowerCase() ?? 'student'}
            </p>
          </div>}
        </div>
        <button
          onClick={logout}
          aria-label="Sign out"
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex w-full items-center rounded-xl py-2 text-sm text-ink-500 transition-colors hover:bg-ink-50 hover:text-red-600',
            collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Sign out'}
        </button>

        {/* Profile Completion for Students */}
        {!collapsed && user && user.role === 'STUDENT' && (
          <ProfileCompletion variant="sidebar" className="mt-0 pt-4 px-0 border-t" />
        )}
      </div>
    </aside>
  );
}

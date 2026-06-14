'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, Video, BarChart2, Bell, Award, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { shortAddress, cn } from '@/lib/utils';

const STUDENT_NAV = [
  { href: '/dashboard/courses',     label: 'My Courses',     icon: BookOpen },
  { href: '/dashboard/certificates',label: 'Certificates',   icon: Award },
  { href: '/notifications',         label: 'Notifications',  icon: Bell },
];

const INSTRUCTOR_NAV = [
  { href: '/dashboard/instructor',  label: 'Dashboard',      icon: BarChart2 },
  { href: '/dashboard/courses',     label: 'My Courses',     icon: BookOpen },
  { href: '/dashboard/courses/create', label: 'New Course',  icon: Video },
  { href: '/notifications',         label: 'Notifications',  icon: Bell },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { user, address, logout } = useAuthStore();
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const nav = isInstructor ? INSTRUCTOR_NAV : STUDENT_NAV;

  return (
    <aside className="w-60 bg-white border-r border-ink-100 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-ink-100">
        <Link href="/" className="font-display text-xl font-semibold text-ink-900">
          Hamplard
        </Link>
        {isInstructor && (
          <span className="ml-2 text-[10px] font-medium text-saffron-600 bg-saffron-50 px-1.5 py-0.5 rounded-md">
            Instructor
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              active
                ? 'bg-saffron-50 text-saffron-700'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )}>
              <Icon className={cn('w-4 h-4', active ? 'text-saffron-600' : 'text-ink-400')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-ink-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-ink-50 mb-2">
          <div className="w-7 h-7 rounded-full bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-saffron-700">
              {(user?.name ?? address ?? 'G').slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-900 truncate">
              {user?.name ?? shortAddress(address ?? '')}
            </p>
            <p className="text-[10px] text-ink-400 capitalize">
              {user?.role?.toLowerCase() ?? 'student'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-ink-500 hover:bg-ink-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

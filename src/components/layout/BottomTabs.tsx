'use client';

import Link from 'next/link';
import { Home, BookOpen, Heart, MessageSquare, User } from 'lucide-react';

export function BottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 md:hidden flex justify-around py-2">
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
      <Link href="/messages" className="flex flex-col items-center text-xs text-ink-600">
        <MessageSquare className="w-5 h-5" />
        Messages
      </Link>
      <Link href="/account" className="flex flex-col items-center text-xs text-ink-600">
        <User className="w-5 h-5" />
        Account
      </Link>
    </nav>
  );
}

export default BottomTabs;

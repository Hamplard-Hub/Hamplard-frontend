'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell, ChevronDown, Menu, Search, ShoppingCart, UserCircle2, X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { shortAddress } from '@/lib/utils';

const CATEGORIES = [
  { title: 'Creative Arts', items: ['Photography', 'Makeup Artistry', 'Fashion Design', 'Nail Technology'] },
  { title: 'Craft & Trade', items: ['Tailoring', 'Hairstyling', 'Wig Making', 'Leatherwork'] },
  { title: 'Food & Hospitality', items: ['Baking', 'Cake Design', 'Catering', 'Food Business'] },
];

export function TopBar() {
  const { isConnected, user, address } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isElevated, setIsElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const avatarText = useMemo(() => {
    if (user?.name) return user.name.slice(0, 1).toUpperCase();
    if (address) return shortAddress(address).slice(0, 1).toUpperCase();
    return 'H';
  }, [address, user?.name]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Hook point for search route integration.
  };

  return (
    <header className={`sticky top-0 z-40 border-b border-[#3C3489] bg-[#26215C] text-white transition-shadow ${
      isElevated ? 'shadow-[0_6px_20px_rgba(38,33,92,0.35)]' : 'shadow-none'
    }`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-3 sm:px-5 lg:gap-5">
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-[#3C3489] lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="shrink-0 font-display text-xl font-semibold tracking-tight text-white">
          Hamplard
        </Link>

        <div className="relative hidden lg:block">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-[#3C3489]"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((prev) => !prev)}
          >
            Categories
            <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
          </button>

          {categoriesOpen && (
            <div className="absolute left-0 top-12 grid w-[620px] grid-cols-3 gap-4 rounded-2xl border border-[#D3D0F2] bg-white p-4 text-[#26215C] shadow-lg">
              {CATEGORIES.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-sm font-semibold">{group.title}</p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className="w-full rounded-md px-2 py-1.5 text-left text-sm text-[#26215C] hover:bg-[#EEEDFE]"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSearch}
          className="mx-auto hidden w-full max-w-2xl items-center rounded-full border border-[#3C3489] bg-white px-4 py-2 lg:flex"
        >
          <Search className="h-4 w-4 text-[#3C3489]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for courses, skills, and instructors"
            className="ml-2 w-full bg-transparent text-sm text-[#26215C] placeholder:text-[#6B66A6] focus:outline-none"
          />
        </form>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {!isConnected ? (
            <>
              <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-[#3C3489]">
                Login
              </Link>
              <Link href="/auth/login" className="rounded-lg bg-[#7F77DD] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C3489]">
                Signup
              </Link>
            </>
          ) : (
            <>
              <Link href="/notifications" className="relative rounded-lg p-2 text-white hover:bg-[#3C3489]" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />
              </Link>
              <Link href="/dashboard/courses" className="rounded-lg p-2 text-white hover:bg-[#3C3489]" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
              <Link href="/dashboard/courses" className="flex items-center gap-2 rounded-full bg-[#3C3489] px-2 py-1.5 pr-3 text-sm font-medium hover:bg-[#7F77DD]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7F77DD] text-xs font-semibold text-white">
                  {avatarText}
                </span>
                <span className="max-w-24 truncate">{user?.name ?? shortAddress(address ?? '')}</span>
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto lg:hidden">
          {isConnected ? (
            <Link href="/dashboard/courses" aria-label="Account" className="inline-flex rounded-full bg-[#3C3489] p-2 text-white hover:bg-[#7F77DD]">
              <UserCircle2 className="h-5 w-5" />
            </Link>
          ) : (
            <Link href="/auth/login" className="rounded-lg bg-[#7F77DD] px-3 py-2 text-sm font-semibold text-white">
              Login
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#3C3489] bg-[#26215C] px-4 pb-4 pt-3 lg:hidden">
          <form onSubmit={handleSearch} className="mb-3 flex items-center rounded-full border border-[#3C3489] bg-white px-4 py-2">
            <Search className="h-4 w-4 text-[#3C3489]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses"
              className="ml-2 w-full bg-transparent text-sm text-[#26215C] placeholder:text-[#6B66A6] focus:outline-none"
            />
          </form>

          <div className="rounded-xl bg-[#3C3489]/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#EEEDFE]">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.flatMap((group) => group.items).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full bg-[#EEEDFE] px-3 py-1 text-xs font-medium text-[#26215C] hover:bg-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {!isConnected ? (
              <>
                <Link href="/auth/login" className="rounded-lg border border-[#7F77DD] px-4 py-2 text-center text-sm font-medium text-white">
                  Login
                </Link>
                <Link href="/auth/login" className="rounded-lg bg-[#7F77DD] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#3C3489]">
                  Signup
                </Link>
              </>
            ) : (
              <>
                <Link href="/notifications" className="rounded-lg border border-[#3C3489] px-4 py-2 text-sm font-medium text-white">
                  Notifications
                </Link>
                <Link href="/dashboard/courses" className="rounded-lg border border-[#3C3489] px-4 py-2 text-sm font-medium text-white">
                  Cart
                </Link>
                <Link href="/dashboard/courses" className="rounded-lg bg-[#7F77DD] px-4 py-2 text-sm font-semibold text-white">
                  My Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

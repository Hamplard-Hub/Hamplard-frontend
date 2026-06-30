'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileDrawerFocusTrap } from '@/lib/hooks/use-focus-trap';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    name: 'Tailoring',
    href: '/search?category=Tailoring',
    description: 'Learn to sew, design, and create stunning garments.',
  },
  {
    name: 'Makeup Artistry',
    href: '/search?category=Makeup+Artistry',
    description: 'Master professional makeup techniques.',
  },
  {
    name: 'Baking',
    href: '/search?category=Baking',
    description: 'From pastries to cakes — bake like a pro.',
  },
  {
    name: 'Photography',
    href: '/search?category=Photography',
    description: 'Capture stunning photos with expert guidance.',
  },
  {
    name: 'Hairstyling',
    href: '/search?category=Hairstyling',
    description: 'Braids, cuts, and styling for every occasion.',
  },
  {
    name: 'Nail Technology',
    href: '/search?category=Nail+Technology',
    description: 'Nail art, acrylics, and professional manicure skills.',
  },
  {
    name: 'Catering',
    href: '/search?category=Catering',
    description: 'Plan and execute memorable events with great food.',
  },
  {
    name: 'Fashion Design',
    href: '/search?category=Fashion+Design',
    description: 'Design, sketch, and produce your own clothing line.',
  },
] as const;

const NAV_LINKS = [
  { label: 'Courses', href: '/dashboard/courses' },
  { label: 'Teach', href: '/dashboard/instructor' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function Header() {
  const { isConnected, user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.getItemCount());

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const megaRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Sticky scroll shadow
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Focus trap + Escape-to-close + return focus to hamburger on close
  useMobileDrawerFocusTrap({
    isOpen: mobileOpen,
    containerRef: drawerRef,
    triggerRef: hamburgerRef,
    onClose: () => setMobileOpen(false),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-[#26215C] transition-shadow duration-300',
        isScrolled && 'shadow-lg',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex-shrink-0 font-display text-xl font-semibold tracking-tight text-white"
        >
          Hamplard
        </Link>

        {/* ── Desktop center: categories mega-menu + search ── */}
        <div className="hidden flex-1 items-center gap-4 md:flex">
          {/* Category mega-menu trigger */}
          <div ref={megaRef} className="relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              onMouseEnter={() => setMegaOpen(true)}
              onClick={() => setMegaOpen((v) => !v)}
              aria-expanded={megaOpen}
              aria-haspopup="true"
            >
              Categories
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  megaOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Mega dropdown */}
            {megaOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-[560px] rounded-xl border border-white/10 bg-[#26215C] p-4 shadow-lg animate-fade-in"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className="group rounded-lg p-3 transition-colors hover:bg-white/10"
                      onClick={() => setMegaOpen(false)}
                    >
                      <p className="text-sm font-semibold text-white">
                        {cat.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 group-hover:text-slate-300">
                        {cat.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="relative ml-auto flex max-w-xs flex-1 items-center"
          >
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-hamplard-primary focus:outline-none focus:ring-1 focus:ring-hamplard-primary"
            />
          </form>
        </div>

        {/* ── Desktop right: auth-dependent icons ── */}
        <div className="hidden items-center gap-2 md:flex">
          {isConnected ? (
            <>
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>

              {/* Cart */}
              <Link
                href="/dashboard/courses"
                className="relative rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-saffron-500 text-[10px] font-bold text-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Avatar dropdown */}
              <div ref={avatarRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/10"
                  aria-expanded={avatarOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-hamplard-primary text-sm font-semibold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </span>
                  )}
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#26215C] p-1.5 shadow-lg animate-fade-in">
                    <div className="border-b border-white/10 px-3 py-2.5">
                      <p className="text-sm font-semibold text-white">
                        {user?.name ?? 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user?.email ?? user?.stellarAddress ?? ''}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAvatarOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/certificates"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7V4a2 2 0 012-2h8.5L20 7.5V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Certificates
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarOpen(false);
                        logout();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-white/10 px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-hamplard-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hamplard-mid"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          ref={hamburgerRef}
          type="button"
          className="ml-auto rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <nav
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-[#26215C] shadow-2xl transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <span className="font-display text-lg font-semibold text-white">Hamplard</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-1 px-4 pb-6 pt-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-hamplard-primary focus:outline-none focus:ring-1 focus:ring-hamplard-primary"
              />
            </form>

            {/* Category links */}
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Categories
            </p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                {cat.name}
              </Link>
            ))}

            <div className="my-3 border-t border-white/10" />

            {/* Nav links */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-3 border-t border-white/10" />

            {/* Auth section */}
            {isConnected ? (
              <>
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/courses"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-saffron-500 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-400 transition-colors hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-white/20 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-hamplard-primary py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-hamplard-mid"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
      </nav>
    </header>
  );
}

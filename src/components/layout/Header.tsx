'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { coursesApi } from '@/lib/api/services';
import { CATEGORY_META, getCategoryMeta } from '@/components/category/CategoryHero';
import type { Category, Course } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert a category name to its /categories/[slug] path */
function categorySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ── Static fallback so the header is never empty before the API responds ──
const STATIC_CATEGORIES = Object.entries(CATEGORY_META).slice(0, 8).map(([slug, m]) => ({
  name: m.name,
  slug,
  description: m.description,
  icon: m.icon,
}));

type MegaCategory = (typeof STATIC_CATEGORIES)[number];

const CATEGORY_SUBCATEGORY_FALLBACKS: Record<string, string[]> = {
  tailoring: ['Pattern Making', 'Garment Construction', 'Alterations'],
  baking: ['Cake Decorating', 'Pastry', 'Bread'],
  photography: ['Portrait', 'Product', 'Lighting'],
  'makeup-artistry': ['Bridal', 'Editorial', 'Special Effects'],
  hairstyling: ['Braiding', 'Cutting', 'Colouring'],
  'nail-technology': ['Nail Art', 'Gel Extensions', 'Nail Care'],
  'web-development': ['Frontend', 'Backend', 'Web Design'],
  business: ['Marketing', 'Finance', 'Entrepreneurship'],
};

function deriveSubcategories(courses: Course[], categoryName: string) {
  const excluded = new Set([
    'about', 'advanced', 'beginner', 'complete', 'course', 'courses', 'from',
    'guide', 'learn', 'masterclass', 'professional', 'skills', 'the', 'with',
    ...categoryName.toLowerCase().split(/\s+/),
  ]);
  const counts = new Map<string, number>();

  for (const course of courses) {
    for (const word of course.title.toLowerCase().split(/\s+/)) {
      const term = word.replace(/[^a-z]/g, '');
      if (term.length > 3 && !excluded.has(term)) {
        counts.set(term, (counts.get(term) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([term]) => term.charAt(0).toUpperCase() + term.slice(1));
}

const NAV_LINKS = [
  { label: 'Courses', href: '/dashboard/courses' },
  { label: 'Teach on Hamplard', href: '/teach' },
  { label: 'Team Plans', href: '/teams' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function Header() {
  const { isConnected, user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const pathname = usePathname();

  /** A nav link is current when it matches the route or one of its sub-routes. */
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState(STATIC_CATEGORIES[0]?.slug ?? '');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── API-backed categories ─────────────────────────────────────────────
  const [megaCategories, setMegaCategories] = useState(STATIC_CATEGORIES);
  const [categoryCourses, setCategoryCourses] = useState<Course[]>([]);

  useEffect(() => {
    coursesApi.getCategories()
      .then((apiCats: Category[]) => {
        if (!apiCats?.length) return;
        const mapped = apiCats.map((c) => {
          const slug = categorySlug(c.name);
          const m = getCategoryMeta(slug);
          return { name: c.name, slug, description: m.description, icon: m.icon };
        });
        setMegaCategories(mapped);
        setActiveCategorySlug(mapped[0]?.slug ?? '');
      })
      .catch(() => {/* keep static fallback */ });

    coursesApi.list({ limit: 100 })
      .then((response) => setCategoryCourses(response.data ?? []))
      .catch(() => {/* categories remain usable without course highlights */ });
  }, []);

  const megaRef = useRef<HTMLDivElement>(null);
  const megaTriggerRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const avatarTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const activeCategory =
    megaCategories.find((category) => category.slug === activeCategorySlug) ?? megaCategories[0];

  const getCategoryCourses = (category: MegaCategory) =>
    categoryCourses
      .filter((course) => course.category.toLowerCase() === category.name.toLowerCase())
      .sort((a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0),
      );

  const getCategorySubcategories = (category: MegaCategory) => {
    const courses = getCategoryCourses(category);
    return deriveSubcategories(courses, category.name).length > 0
      ? deriveSubcategories(courses, category.name)
      : CATEGORY_SUBCATEGORY_FALLBACKS[category.slug] ?? ['Popular skills'];
  };

  const handleCategoryArrowKeys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const direction = ['ArrowDown', 'ArrowRight'].includes(event.key)
      ? 1
      : ['ArrowUp', 'ArrowLeft'].includes(event.key)
        ? -1
        : 0;
    const options = Array.from(
      event.currentTarget.closest('[data-category-list]')
        ?.querySelectorAll<HTMLButtonElement>('[data-category-option]') ?? [],
    );
    if (!direction || options.length === 0) return;

    event.preventDefault();
    const index = options.indexOf(event.target as HTMLButtonElement);
    options[(index + direction + options.length) % options.length]?.focus();
  };

  // Sticky scroll shadow
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

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

  // Category selectors use normal Tab order plus arrow-key movement.
  useEffect(() => {
    if (!megaOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMegaOpen(false);
        megaTriggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [megaOpen]);

  // Keyboard support for the user menu: role="menu" implies arrow-key roving
  // focus, so items are taken out of the tab sequence and driven from here.
  useEffect(() => {
    const menu = avatarMenuRef.current;
    if (!avatarOpen || !menu) return;

    const getItems = () =>
      Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));

    getItems()[0]?.focus();

    function closeAndRestore() {
      setAvatarOpen(false);
      avatarTriggerRef.current?.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      const items = getItems();
      if (items.length === 0) return;
      const index = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          items[(index + 1) % items.length]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          items[(index - 1 + items.length) % items.length]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          items[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        case 'Escape':
          e.preventDefault();
          closeAndRestore();
          break;
        case 'Tab':
          // Close and hand focus back to the trigger, letting the browser
          // continue the tab sequence from there.
          closeAndRestore();
          break;
      }
    }

    menu.addEventListener('keydown', handleKeyDown);
    return () => menu.removeEventListener('keydown', handleKeyDown);
  }, [avatarOpen]);

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

  const activeFeaturedCourse = activeCategory
    ? getCategoryCourses(activeCategory)[0]
    : undefined;

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
          <nav aria-label="Main navigation" className="flex items-center gap-4">
            {/* Category mega-menu trigger */}
            <div
              ref={megaRef}
              className="relative"
            >
              <button
                ref={megaTriggerRef}
                type="button"
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-300"
                onMouseEnter={() => setMegaOpen(true)}
                onClick={() => setMegaOpen((v) => !v)}
                onFocus={() => setMegaOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setMegaOpen(true);
                    window.requestAnimationFrame(() => {
                      megaRef.current?.querySelector<HTMLButtonElement>('[data-category-option]')?.focus();
                    });
                  }
                }}
                aria-expanded={megaOpen}
                aria-controls="category-mega-menu"
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
              {megaOpen && activeCategory && (
                <div
                  id="category-mega-menu"
                  aria-label="Course categories"
                  className="fixed inset-x-0 top-16 z-[60] border-b border-ink-200 bg-white shadow-xl animate-fade-in"
                >
                  <div className="mx-auto grid max-h-[min(75vh,680px)] max-w-7xl grid-cols-1 gap-6 overflow-y-auto px-4 py-6 sm:px-6 md:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
                    <div>
                      <div
                        className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4"
                        data-category-list
                      >
                        {megaCategories.map((category) => {
                          const selected = activeCategory.slug === category.slug;
                          const subcategories = getCategorySubcategories(category);
                          return (
                            <div key={category.slug} className="min-w-0">
                              <button
                                type="button"
                                data-category-option
                                onKeyDown={handleCategoryArrowKeys}
                                aria-pressed={selected}
                                onMouseEnter={() => setActiveCategorySlug(category.slug)}
                                onFocus={() => setActiveCategorySlug(category.slug)}
                                onClick={() => setActiveCategorySlug(category.slug)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors',
                                  selected
                                    ? 'bg-saffron-50 text-saffron-800'
                                    : 'text-ink-800 hover:bg-ink-50',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-inset',
                                )}
                              >
                                <span aria-hidden="true" className="text-lg">{category.icon}</span>
                                <span className="truncate">{category.name}</span>
                              </button>
                              <div className="mt-1 space-y-1 pl-10">
                                {subcategories.map((subcategory) => (
                                  <Link
                                    key={subcategory}
                                    href={`/categories/${category.slug}?sub=${encodeURIComponent(subcategory)}`}
                                    onClick={() => setMegaOpen(false)}
                                    className="block truncate rounded px-1 py-0.5 text-xs text-ink-500 hover:text-hamplard-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
                                  >
                                    {subcategory}
                                  </Link>
                                ))}
                                <Link
                                  href={`/categories/${category.slug}`}
                                  onClick={() => setMegaOpen(false)}
                                  className="block rounded px-1 py-0.5 text-xs font-medium text-hamplard-primary hover:text-hamplard-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
                                >
                                  All {category.name} courses
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Link
                        href="/courses"
                        onClick={() => setMegaOpen(false)}
                        className="mt-5 inline-flex items-center border-t border-ink-100 pt-4 text-sm font-semibold text-hamplard-primary hover:text-hamplard-mid"
                      >
                        Browse all courses <span aria-hidden="true" className="ml-1">→</span>
                      </Link>
                    </div>

                    <aside className="rounded-lg bg-ink-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-ink-500">
                        Featured in {activeCategory.name}
                      </p>
                      {activeFeaturedCourse ? (
                        <Link
                          href={`/courses/${activeFeaturedCourse.id}`}
                          onClick={() => setMegaOpen(false)}
                          className="group block overflow-hidden rounded-md bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
                        >
                          {activeFeaturedCourse.thumbnailUrl ? (
                            <img
                              src={activeFeaturedCourse.thumbnailUrl}
                              alt=""
                              className="aspect-video w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-video items-center justify-center bg-saffron-50 text-5xl" aria-hidden="true">
                              {activeCategory.icon}
                            </div>
                          )}
                          <div className="p-3">
                            <p className="line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-hamplard-primary">
                              {activeFeaturedCourse.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-ink-500">
                              {activeFeaturedCourse.instructor.name ?? 'Hamplard instructor'}
                            </p>
                            {activeFeaturedCourse.rating != null && (
                              <p className="mt-2 text-xs font-semibold text-saffron-700">
                                {activeFeaturedCourse.rating.toFixed(1)} / 5 rating
                              </p>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <Link
                          href={`/categories/${activeCategory.slug}`}
                          onClick={() => setMegaOpen(false)}
                          className="flex min-h-48 flex-col items-center justify-center rounded-md bg-white p-4 text-center transition-colors hover:bg-saffron-50"
                        >
                          <span className="text-4xl" aria-hidden="true">{activeCategory.icon}</span>
                          <span className="mt-3 text-sm font-semibold text-ink-800">
                            Explore {activeCategory.name}
                          </span>
                          <span className="mt-1 text-xs text-ink-500">See available courses</span>
                        </Link>
                      )}
                    </aside>
                  </div>
                </div>
              )}
            </div>

            {/* Nav links */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Course search"
            className="relative ml-auto flex max-w-xs flex-1 items-center"
          >
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-hamplard-primary focus:outline-none focus:ring-1 focus:ring-hamplard-primary"
            />
          </form>
        </div>

        {/* ── Desktop right: auth-dependent icons ── */}
        <div className="hidden items-center gap-2 md:flex">
          {isConnected ? (
            <>
              {/* Notifications */}
              <NotificationDropdown />

              {/* Cart */}
              <Link
                href="/dashboard/courses"
                className="relative rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={
                  cartCount === 1
                    ? 'Shopping cart with 1 item'
                    : `Shopping cart with ${cartCount} items`
                }
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {/*
                  Count badge doubles as a live region, so it must stay mounted
                  even at zero — a region that unmounts announces nothing when
                  it comes back. It is visually hidden instead.
                */}
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className={cn(
                    'items-center justify-center rounded-full text-[10px] font-bold text-white',
                    cartCount > 0
                      ? 'absolute -right-0.5 -top-0.5 flex h-4 w-4 bg-saffron-500'
                      : 'sr-only',
                  )}
                >
                  <span aria-hidden="true">{cartCount > 9 ? '9+' : cartCount}</span>
                  <span className="sr-only">
                    {cartCount === 1 ? '1 item in cart' : `${cartCount} items in cart`}
                  </span>
                </span>
              </Link>

              {/* Avatar dropdown */}
              <div ref={avatarRef} className="relative">
                <button
                  ref={avatarTriggerRef}
                  type="button"
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/10"
                  aria-expanded={avatarOpen}
                  aria-haspopup="menu"
                  aria-controls={avatarOpen ? 'user-menu' : undefined}
                  aria-label="User menu"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user?.name ?? 'User'} avatar`}
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
                    <div ref={avatarMenuRef} id="user-menu" role="menu" aria-label="User menu">
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setAvatarOpen(false)}
                        className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/certificates"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M4 7V4a2 2 0 012-2h8.5L20 7.5V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Certificates
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => {
                          setAvatarOpen(false);
                          logout();
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-white/10 px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-white/10"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Log out
                      </button>
                    </div>
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
          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Course search"
            className="relative mb-4"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-hamplard-primary focus:outline-none focus:ring-1 focus:ring-hamplard-primary"
            />
          </form>

          {/* Mobile category mega menu */}
          <button
            type="button"
            onClick={() => setMobileCategoriesOpen((open) => !open)}
            aria-expanded={mobileCategoriesOpen}
            aria-controls="mobile-category-menu"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:bg-white/10"
          >
            Categories
            <ChevronDown className={cn('h-4 w-4 transition-transform', mobileCategoriesOpen && 'rotate-180')} />
          </button>
          {mobileCategoriesOpen && activeCategory && (
            <div id="mobile-category-menu" className="space-y-3 rounded-lg bg-white/5 p-3">
              <div className="space-y-1" data-category-list>
                {megaCategories.map((category) => {
                  const selected = activeCategory.slug === category.slug;
                  return (
                    <div key={category.slug}>
                      <button
                        type="button"
                        data-category-option
                        aria-pressed={selected}
                        onKeyDown={handleCategoryArrowKeys}
                        onFocus={() => setActiveCategorySlug(category.slug)}
                        onClick={() => setActiveCategorySlug(category.slug)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
                          selected ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/10',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-300 focus-visible:ring-inset',
                        )}
                      >
                        <span aria-hidden="true">{category.icon}</span>
                        {category.name}
                      </button>
                      {selected && (
                        <div className="ml-8 mt-1 space-y-1 border-l border-white/15 pl-3">
                          {getCategorySubcategories(category).map((subcategory) => (
                            <Link
                              key={subcategory}
                              href={`/categories/${category.slug}?sub=${encodeURIComponent(subcategory)}`}
                              onClick={() => setMobileOpen(false)}
                              className="block rounded px-2 py-1.5 text-xs text-white/65 hover:bg-white/10 hover:text-white"
                            >
                              {subcategory}
                            </Link>
                          ))}
                          <Link
                            href={`/categories/${category.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded px-2 py-1.5 text-xs font-semibold text-saffron-300 hover:bg-white/10"
                          >
                            All {category.name} courses
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-md bg-white p-3 text-ink-900">
                <p className="text-[10px] font-semibold uppercase text-ink-500">
                  Featured in {activeCategory.name}
                </p>
                <Link
                  href={activeFeaturedCourse ? `/courses/${activeFeaturedCourse.id}` : `/categories/${activeCategory.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
                >
                  {activeFeaturedCourse?.thumbnailUrl ? (
                    <img
                      src={activeFeaturedCourse.thumbnailUrl}
                      alt=""
                      className="h-14 w-20 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded bg-saffron-50 text-2xl" aria-hidden="true">
                      {activeCategory.icon}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-ink-900 line-clamp-2">
                      {activeFeaturedCourse?.title ?? `Explore ${activeCategory.name}`}
                    </span>
                    <span className="mt-1 block text-[10px] text-ink-500">
                      {activeFeaturedCourse ? 'Featured course' : 'See available courses'}
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          )}

          <div className="my-3 border-t border-white/10" />

          {/* Nav links */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
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
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Cart
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className={cn(
                    'items-center justify-center rounded-full text-xs font-bold text-white',
                    cartCount > 0
                      ? 'ml-auto flex h-5 w-5 bg-saffron-500'
                      : 'sr-only',
                  )}
                >
                  <span aria-hidden="true">{cartCount}</span>
                  <span className="sr-only">
                    {cartCount === 1 ? '1 item in cart' : `${cartCount} items in cart`}
                  </span>
                </span>
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

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, FileText, Loader2, PlayCircle, Search } from 'lucide-react';
import { coursesApi, enrollmentsApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { cn } from '@/lib/utils';

type ItemKind = 'course' | 'lesson' | 'page';

export interface CommandItem {
  id: string;
  kind: ItemKind;
  title: string;
  subtitle?: string;
  href: string;
}

interface Section {
  heading: string;
  items: CommandItem[];
}

const RECENT_KEY = 'hamplard_command_palette_recent';
const RECENT_LIMIT = 5;
const SEARCH_DEBOUNCE_MS = 200;
const MAX_RESULTS_PER_SECTION = 6;

const PAGES: CommandItem[] = [
  { id: 'page:home', kind: 'page', title: 'Home', href: '/' },
  { id: 'page:courses', kind: 'page', title: 'Browse courses', href: '/courses' },
  { id: 'page:categories', kind: 'page', title: 'Categories', href: '/categories' },
  { id: 'page:instructors', kind: 'page', title: 'Instructors', href: '/instructors' },
  { id: 'page:leaderboard', kind: 'page', title: 'Leaderboard', href: '/leaderboard' },
  { id: 'page:pricing', kind: 'page', title: 'Pricing', href: '/pricing' },
  { id: 'page:dashboard', kind: 'page', title: 'Dashboard', href: '/dashboard' },
  { id: 'page:my-courses', kind: 'page', title: 'My courses', href: '/dashboard/my-courses' },
  { id: 'page:certificates', kind: 'page', title: 'Certificates', href: '/dashboard/certificates' },
  { id: 'page:notifications', kind: 'page', title: 'Notifications', href: '/notifications' },
  { id: 'page:settings', kind: 'page', title: 'Settings', href: '/dashboard/settings' },
  { id: 'page:cart', kind: 'page', title: 'Cart', href: '/cart' },
  { id: 'page:teach', kind: 'page', title: 'Teach on Hamplard', href: '/teach' },
  { id: 'page:help', kind: 'page', title: 'Help center', href: '/help' },
  { id: 'page:contact', kind: 'page', title: 'Contact us', href: '/contact' },
];

function readRecent(): CommandItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CommandItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as CommandItem).id === 'string' &&
          typeof (item as CommandItem).title === 'string' &&
          typeof (item as CommandItem).href === 'string' &&
          (item as CommandItem).href.startsWith('/'),
      )
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function saveRecent(item: CommandItem): CommandItem[] {
  const next = [item, ...readRecent().filter((entry) => entry.id !== item.id)].slice(0, RECENT_LIMIT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Recent items are best-effort when storage is unavailable.
  }
  return next;
}

function matches(query: string, ...fields: Array<string | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

const KIND_ICONS = {
  course: BookOpen,
  lesson: PlayCircle,
  page: FileText,
} as const;

export function CommandPalette() {
  const router = useRouter();
  const isConnected = useAuthStore((s) => s.isConnected);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<CommandItem[]>([]);
  const [courses, setCourses] = useState<CommandItem[]>([]);
  const [lessons, setLessons] = useState<CommandItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    previousFocusRef.current?.focus?.();
  }, []);

  // Global Ctrl/Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (openRef.current) {
          close();
        } else {
          previousFocusRef.current = document.activeElement as HTMLElement | null;
          setOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // On open: focus input, load recent items and the user's lessons
  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let cancelled = false;
    if (isConnected) {
      enrollmentsApi
        .getMy(1, 50)
        .then((res) => {
          if (cancelled) return;
          const items: CommandItem[] = (res.data ?? []).flatMap((enrollment) => {
            const course = enrollment.course;
            if (!course) return [];
            return (course.modules ?? []).flatMap((module) =>
              (module.lessons ?? []).map((lesson) => ({
                id: `lesson:${lesson.id}`,
                kind: 'lesson' as const,
                title: lesson.title,
                subtitle: course.title,
                href: `/dashboard/courses/${course.id}/learn?lesson=${encodeURIComponent(lesson.id)}`,
              })),
            );
          });
          setLessons(items);
        })
        .catch(() => {
          if (!cancelled) setLessons([]);
        });
    } else {
      setLessons([]);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isConnected]);

  // Debounced course search
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (!term) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }

    let cancelled = false;
    setLoadingCourses(true);
    const timer = window.setTimeout(() => {
      coursesApi
        .list({ search: term, limit: MAX_RESULTS_PER_SECTION })
        .then((res) => {
          if (cancelled) return;
          setCourses(
            (res.data ?? []).map((course) => ({
              id: `course:${course.id}`,
              kind: 'course' as const,
              title: course.title,
              subtitle: course.instructor?.name ?? course.category,
              href: `/courses/${course.id}`,
            })),
          );
        })
        .catch(() => {
          if (!cancelled) setCourses([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingCourses(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const sections = useMemo<Section[]>(() => {
    const term = query.trim();
    if (!term) {
      return [
        { heading: 'Recent', items: recent },
        { heading: 'Pages', items: PAGES.slice(0, MAX_RESULTS_PER_SECTION) },
      ].filter((section) => section.items.length > 0);
    }

    return [
      { heading: 'Courses', items: courses },
      {
        heading: 'My lessons',
        items: lessons.filter((item) => matches(term, item.title, item.subtitle)).slice(0, MAX_RESULTS_PER_SECTION),
      },
      {
        heading: 'Pages',
        items: PAGES.filter((item) => matches(term, item.title, item.href)).slice(0, MAX_RESULTS_PER_SECTION),
      },
    ].filter((section) => section.items.length > 0);
  }, [query, recent, courses, lessons]);

  const flatItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= flatItems.length) setActiveIndex(Math.max(0, flatItems.length - 1));
  }, [activeIndex, flatItems.length]);

  // Keep the active option scrolled into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  const select = useCallback(
    (item: CommandItem) => {
      setRecent(saveRecent(item));
      setOpen(false);
      setQuery('');
      setActiveIndex(0);
      router.push(item.href);
    },
    [router],
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (flatItems.length) setActiveIndex((i) => (i + 1) % flatItems.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (flatItems.length) setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
        break;
      case 'Home':
        if (flatItems.length) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (flatItems.length) {
          event.preventDefault();
          setActiveIndex(flatItems.length - 1);
        }
        break;
      case 'Enter': {
        event.preventDefault();
        const item = flatItems[activeIndex];
        if (item) select(item);
        break;
      }
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        // The input is the only focusable element; keep focus inside the dialog.
        event.preventDefault();
        break;
    }
  };

  if (!mounted || !open) return null;

  const activeItem = flatItems[activeIndex];
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  let runningIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-ink-900/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeItem ? optionId(activeIndex) : undefined}
            aria-label="Search courses, lessons and pages"
            placeholder="Search courses, lessons and pages…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            className="h-12 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {loadingCourses && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-400" aria-hidden="true" />}
          <kbd className="hidden shrink-0 rounded border border-ink-200 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 sm:inline">
            Esc
          </kbd>
        </div>

        <ul ref={listRef} id={listboxId} role="listbox" aria-label="Results" className="max-h-[60vh] overflow-y-auto p-2">
          {sections.length === 0 ? (
            <li role="presentation" className="px-3 py-8 text-center text-sm text-ink-500">
              {loadingCourses ? 'Searching…' : `No results for "${query.trim()}"`}
            </li>
          ) : (
            sections.map((section) => (
              <li key={section.heading} role="presentation">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400" aria-hidden="true">
                  {section.heading}
                </p>
                <ul role="group" aria-label={section.heading}>
                  {section.items.map((item) => {
                    runningIndex += 1;
                    const index = runningIndex;
                    const isActive = index === activeIndex;
                    const Icon = section.heading === 'Recent' ? Clock : KIND_ICONS[item.kind] ?? FileText;
                    return (
                      <li
                        key={`${section.heading}-${item.id}`}
                        id={optionId(index)}
                        role="option"
                        aria-selected={isActive}
                        data-index={index}
                        onMouseMove={() => setActiveIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => select(item)}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                          isActive ? 'bg-saffron-50 text-ink-900' : 'text-ink-700',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-saffron-600' : 'text-ink-400')} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && <span className="block truncate text-xs text-ink-500">{item.subtitle}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-ink-100 px-4 py-2 text-[11px] text-ink-500">
          <span>
            <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="font-sans">Enter</kbd> to open
          </span>
          <span>
            <kbd className="font-sans">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CommandPalette;

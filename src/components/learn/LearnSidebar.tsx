'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Check, Play, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseModule, Lesson } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSectionDuration(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

function formatLectureDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LearnSidebarProps {
  modules: CourseModule[];
  currentLessonId?: string;
  completedLessonIds?: string[];
  onSelectLesson?: (lessonId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LearnSidebar({
  modules,
  currentLessonId,
  completedLessonIds = [],
  onSelectLesson,
}: LearnSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand the section containing the current lesson
    if (modules.length > 0 && currentLessonId) {
      const section = modules.find((m) =>
        m.lessons.some((l) => l.id === currentLessonId),
      );
      if (section) return new Set([section.id]);
    }
    return modules.length > 0 ? new Set([modules[0].id]) : new Set();
  });

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  const stats = useMemo(() => {
    let totalLectures = 0;
    let totalDurationSecs = 0;
    let completedCount = 0;
    for (const mod of modules) {
      totalLectures += mod.lessons.length;
      for (const lesson of mod.lessons) {
        totalDurationSecs += lesson.videoDuration ?? 0;
        if (completedSet.has(lesson.id)) completedCount++;
      }
    }
    return { totalLectures, totalDurationSecs, completedCount };
  }, [modules, completedSet]);

  const allExpanded = expandedIds.size === modules.length;

  const toggleSection = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) setExpandedIds(new Set());
    else setExpandedIds(new Set(modules.map((m) => m.id)));
  }, [allExpanded, modules]);

  const handleSelectLesson = useCallback(
    (lessonId: string) => {
      onSelectLesson?.(lessonId);
      if (isMobile) setDrawerOpen(false);
    },
    [onSelectLesson, isMobile],
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-ink-200 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Course Curriculum</h2>
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-500">
            {stats.completedCount}/{stats.totalLectures} completed
          </p>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-hamplard-primary transition-colors hover:text-hamplard-mid"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink-100">
        {modules.map((mod) => {
          const isOpen = expandedIds.has(mod.id);
          const sectionSecs = mod.lessons.reduce(
            (sum, l) => sum + (l.videoDuration ?? 0),
            0,
          );
          const sectionCompleted = mod.lessons.every((l) => completedSet.has(l.id));

          return (
            <div key={mod.id}>
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(mod.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 bg-ink-50 px-4 py-3 text-left transition-colors hover:bg-ink-100"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-ink-500 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-ink-900 truncate">
                    {mod.title}
                  </span>
                  <span className="text-xs text-ink-500">
                    {mod.lessons.length} lectures • {formatSectionDuration(sectionSecs)}
                  </span>
                </div>
                {sectionCompleted && (
                  <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                )}
              </button>

              {/* Lessons list */}
              {isOpen && (
                <ul className="animate-fade-in">
                  {mod.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const isCompleted = completedSet.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectLesson(lesson.id)}
                          className={cn(
                            'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                            isCurrent
                              ? 'bg-hamplard-lilac/60 border-l-2 border-hamplard-primary'
                              : 'border-l-2 border-transparent hover:bg-ink-50',
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <Play
                              className={cn(
                                'h-4 w-4 flex-shrink-0',
                                isCurrent ? 'text-hamplard-primary' : 'text-ink-400',
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              'flex-1 truncate',
                              isCurrent
                                ? 'font-semibold text-hamplard-deep'
                                : isCompleted
                                  ? 'text-ink-600'
                                  : 'text-ink-700',
                            )}
                          >
                            {lesson.title}
                          </span>
                          {lesson.videoDuration && lesson.videoDuration > 0 && (
                            <span className="flex items-center gap-1 flex-shrink-0 text-xs text-ink-400">
                              <Clock className="h-3 w-3" />
                              {formatLectureDuration(lesson.videoDuration)}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Mobile: bottom drawer
  if (isMobile) {
    return (
      <>
        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-hamplard-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:bg-hamplard-mid active:scale-95"
          aria-label="Open curriculum"
        >
          <Play className="h-4 w-4" />
          Curriculum
        </button>

        {/* Overlay */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out',
            drawerOpen ? 'translate-y-0' : 'translate-y-full',
          )}
          style={{ maxHeight: '80vh' }}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-ink-300" />
          </div>
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <div
      className={cn(
        'relative flex flex-col border-r border-ink-200 bg-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-12' : 'w-72 lg:w-80',
      )}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:bg-ink-50 hover:text-ink-700"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <Play className="h-5 w-5 text-ink-400" />
          <span className="text-[10px] font-medium text-ink-500 rotate-180 writing-mode-vertical">
            Curriculum
          </span>
        </div>
      ) : (
        sidebarContent
      )}
    </div>
  );
}

export default LearnSidebar;

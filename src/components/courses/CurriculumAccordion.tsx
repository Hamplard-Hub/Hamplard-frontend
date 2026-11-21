'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Play, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseModule, Lesson } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Props ───────────────────────────────────────────────────────────────────

interface CurriculumAccordionProps {
  modules: CourseModule[];
  /** Id of the lesson currently playing; its module auto-expands. */
  activeLessonId?: string;
  /** Ids of lessons the learner has completed. */
  completedLessonIds?: string[];
}

// ─── Placeholder data (used when modules array is empty) ─────────────────────

const PLACEHOLDER_MODULES: CourseModule[] = [
  {
    id: 'mod-1',
    courseId: 'course-1',
    title: 'Getting Started',
    position: 1,
    lessons: [
      {
        id: 'les-1',
        moduleId: 'mod-1',
        title: 'Welcome to the Course',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 180,
        content: null,
        resourceUrl: null,
        position: 1,
        isFree: true,
      },
      {
        id: 'les-2',
        moduleId: 'mod-1',
        title: 'Course Overview & What You Will Learn',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 420,
        content: null,
        resourceUrl: null,
        position: 2,
        isFree: true,
      },
      {
        id: 'les-3',
        moduleId: 'mod-1',
        title: 'Setting Up Your Workspace',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 540,
        content: null,
        resourceUrl: null,
        position: 3,
        isFree: false,
      },
    ],
  },
  {
    id: 'mod-2',
    courseId: 'course-1',
    title: 'Core Fundamentals',
    position: 2,
    lessons: [
      {
        id: 'les-4',
        moduleId: 'mod-2',
        title: 'Understanding the Basics',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 720,
        content: null,
        resourceUrl: null,
        position: 1,
        isFree: false,
      },
      {
        id: 'les-5',
        moduleId: 'mod-2',
        title: 'Hands-On Practice Session',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 900,
        content: null,
        resourceUrl: null,
        position: 2,
        isFree: false,
      },
      {
        id: 'les-6',
        moduleId: 'mod-2',
        title: 'Common Mistakes to Avoid',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 480,
        content: null,
        resourceUrl: null,
        position: 3,
        isFree: true,
      },
    ],
  },
  {
    id: 'mod-3',
    courseId: 'course-1',
    title: 'Advanced Techniques',
    position: 3,
    lessons: [
      {
        id: 'les-7',
        moduleId: 'mod-3',
        title: 'Professional Workflow',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 660,
        content: null,
        resourceUrl: null,
        position: 1,
        isFree: false,
      },
      {
        id: 'les-8',
        moduleId: 'mod-3',
        title: 'Real-World Project',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 1200,
        content: null,
        resourceUrl: null,
        position: 2,
        isFree: false,
      },
    ],
  },
  {
    id: 'mod-4',
    courseId: 'course-1',
    title: 'Final Project & Next Steps',
    position: 4,
    lessons: [
      {
        id: 'les-9',
        moduleId: 'mod-4',
        title: 'Building Your Portfolio Piece',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 1500,
        content: null,
        resourceUrl: null,
        position: 1,
        isFree: false,
      },
      {
        id: 'les-10',
        moduleId: 'mod-4',
        title: 'Where to Go From Here',
        description: null,
        type: 'VIDEO',
        videoUrl: '#',
        videoDuration: 300,
        content: null,
        resourceUrl: null,
        position: 2,
        isFree: true,
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumAccordion({
  modules,
  activeLessonId,
  completedLessonIds = [],
}: CurriculumAccordionProps) {
  const data = modules.length > 0 ? modules : PLACEHOLDER_MODULES;

  const completedSet = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds],
  );

  // Module that contains the currently playing lesson (if any).
  const activeModuleId = useMemo(() => {
    if (!activeLessonId) return null;
    const mod = data.find((m) =>
      m.lessons.some((l) => l.id === activeLessonId),
    );
    return mod?.id ?? null;
  }, [data, activeLessonId]);

  // First section (and the active module) expanded by default. Initialized
  // once so re-renders don't reset the user's expand/collapse choices.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (data.length > 0) initial.add(data[0].id);
    if (activeModuleId) initial.add(activeModuleId);
    return initial;
  });

  const stats = useMemo(() => {
    let totalLectures = 0;
    let totalDurationSecs = 0;
    for (const mod of data) {
      totalLectures += mod.lessons.length;
      for (const lesson of mod.lessons) {
        totalDurationSecs += lesson.videoDuration ?? 0;
      }
    }
    return { totalLectures, totalDurationSecs };
  }, [data]);

  const allExpanded = expandedIds.size === data.length;

  function toggleSection(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(data.map((m) => m.id)));
    }
  }

  return (
    <div>
      {/* ── Summary bar ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-500">
          <span className="font-semibold text-ink-700">
            {stats.totalLectures}
          </span>{' '}
          lectures &middot;{' '}
          <span className="font-semibold text-ink-700">
            {formatSectionDuration(stats.totalDurationSecs)}
          </span>{' '}
          total length
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm font-medium text-hamplard-primary transition-colors hover:text-hamplard-mid"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* ── Sections ── */}
      <div className="divide-y divide-ink-100 rounded-xl border border-ink-200 overflow-hidden">
        {data.map((mod) => {
          const isOpen = expandedIds.has(mod.id);
          const lectureCount = mod.lessons.length;
          const sectionSecs = mod.lessons.reduce(
            (sum, l) => sum + (l.videoDuration ?? 0),
            0,
          );
          const completedCount = mod.lessons.filter((l) =>
            completedSet.has(l.id),
          ).length;
          const progressPct =
            lectureCount > 0
              ? Math.round((completedCount / lectureCount) * 100)
              : 0;

          return (
            <div key={mod.id}>
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(mod.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 bg-ink-50 px-4 py-3.5 text-left transition-colors hover:bg-ink-100"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-ink-500 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
                <span className="flex-1 text-sm font-semibold text-ink-900">
                  {mod.title}
                </span>
                <span className="hidden text-xs text-ink-500 sm:inline">
                  {lectureCount} lecture{lectureCount !== 1 ? 's' : ''} &middot;{' '}
                  {formatSectionDuration(sectionSecs)}
                </span>
              </button>

              {/* Per-module progress */}
              <div className="flex items-center gap-2 bg-ink-50 px-4 pb-3">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${mod.title} progress`}
                >
                  <div
                    className="h-full rounded-full bg-hamplard-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-ink-500">
                  {completedCount}/{lectureCount} lessons complete
                </span>
              </div>

              {/* Lessons list */}
              {isOpen && (
                <ul className="animate-fade-in">
                  {mod.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className={cn(
                        'flex items-center gap-3 border-t border-ink-100 px-4 py-3',
                        lesson.id === activeLessonId && 'bg-hamplard-primary/5',
                      )}
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                        {lesson.type === 'VIDEO' ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </span>
                      <span className="flex-1 text-sm text-ink-700">
                        {lesson.title}
                      </span>
                      {lesson.isFree && (
                        <span className="rounded bg-hamplard-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-hamplard-primary">
                          Free
                        </span>
                      )}
                      {lesson.videoDuration != null && (
                        <span className="flex items-center gap-1 text-xs text-ink-400">
                          <Clock className="h-3 w-3" />
                          {formatLectureDuration(lesson.videoDuration)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

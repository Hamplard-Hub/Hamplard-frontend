"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Download, Loader2, ArrowLeft, Award, SkipForward, MessageSquare, Lock,
  Clock, Maximize2, Minimize2,
} from 'lucide-react';
import Link from 'next/link';
import { coursesApi, enrollmentsApi, lessonsApi } from '@/lib/api/services';
import { formatDuration, cn } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import CourseCompletionModal from '@/components/learn/CourseCompletionModal';
import { AssignmentSubmission } from '@/components/learn/AssignmentSubmission';
import { VideoPlayer } from '@/components/learn/VideoPlayer';
import { AutoplayCountdown } from '@/components/learn/AutoplayCountdown';
import NotesPanel from '@/components/learn/NotesPanel';
import { QuizComponent } from '@/components/learn/QuizComponent';
import { StepChecklist } from '@/components/learn/StepChecklist';
import { getModuleLockInfo } from '@/components/learn/LearnSidebar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { Course, Enrollment, Lesson, QuizQuestion } from '@/types';

// ── Constants ──────────────────────────────────────────────────────────────
const AUTOPLAY_STORAGE_KEY = 'hamplard:autoplay';
const FOCUS_MODE_STORAGE_KEY = 'hamplard_learn_focus_mode';
const WORDS_PER_MINUTE = 200;

// SidebarTab type
type SidebarTab = 'lessons' | 'notes' | 'qa';

// Fallback questions shown when a QUIZ lesson has no quiz data
const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns the flat ordered list of all lessons across every module */
function flatLessons(course: Course): Lesson[] {
  return course.modules?.flatMap((m) => m.lessons) ?? [];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lessonParam = searchParams.get('lesson');
  // Captured once so the initial load does not re-run on every lesson change
  const initialLessonRef = useRef<string | null>(lessonParam);
  const toast = useToast();
  // requestedLessonId reserved for future deep-link support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _requestedLessonId = searchParams.get("lesson");

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<'notFound' | 'network' | null>(null);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("lessons");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Autoplay state ───────────────────────────────────────────────────────
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(AUTOPLAY_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [showCountdown, setShowCountdown] = useState(false);

  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const previousCompletedCountRef = useRef<number | null>(null);
  const hasInitializedCompletionState = useRef(false);

  // videoRef forwarded into VideoPlayer so NotesPanel can read current time
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const completedIds = useMemo(() => {
    return new Set(
      enrollment?.lessonProgress
        ?.filter((p: { completed: boolean }) => p.completed)
        .map((p: { lessonId: string }) => p.lessonId) ?? [],
    );
  }, [enrollment]);

  const handleSeek = useCallback((timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play?.().catch(() => {});
    }
  }, []);

  // ── Derived: next lesson ─────────────────────────────────────────────────
  const nextLesson = useMemo<Lesson | null>(() => {
    if (!course || !activeLesson) return null;
    const all = flatLessons(course);
    const idx = all.findIndex((l) => l.id === activeLesson.id);
    return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  }, [course, activeLesson]);

  // selectLesson: named alias for setActiveLesson used in QuizComponent onContinue
  const selectLesson = useCallback((lesson: Lesson) => {
    setActiveLesson(lesson);
    const params = new URLSearchParams(searchParams.toString());
    params.set('lesson', lesson.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // ── Persist autoplay preference ──────────────────────────────────────────
  const handleAutoplayChange = useCallback((enabled: boolean) => {
    setAutoplay(enabled);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(enabled));
    }
    if (!enabled) setShowCountdown(false);
  }, []);

  // ── Video ended handler ──────────────────────────────────────────────────
  const handleVideoEnded = useCallback(() => {
    if (autoplay && nextLesson) {
      setShowCountdown(true);
    }
  }, [autoplay, nextLesson]);

  // ── Navigate to next lecture ─────────────────────────────────────────────
  const goToNext = useCallback(() => {
    if (!nextLesson || !course) return;
    const nextModIdx = course.modules?.findIndex((m) =>
      m.lessons.some((l) => l.id === nextLesson.id),
    ) ?? -1;
    if (nextModIdx !== -1 && course.modules) {
      const lock = getModuleLockInfo(course.modules[nextModIdx], nextModIdx, course.modules, completedIds);
      if (lock.isLocked) {
        toast.warning({
          title: 'Lesson Locked',
          description: lock.reason || 'This lesson is currently locked.',
        });
        setShowCountdown(false);
        return;
      }
    }
    setShowCountdown(false);
    selectLesson(nextLesson);
  }, [nextLesson, selectLesson]);
    setActiveLesson(nextLesson);
  }, [nextLesson, course, completedIds, toast]);

  const cancelCountdown = useCallback(() => {
    setShowCountdown(false);
  }, []);

  // ── Initial data load ────────────────────────────────────────────────────
  const loadCourseData = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      coursesApi.get(id),
      enrollmentsApi.get(id),
    ]).then(([c, e]) => {
      setCourse(c);
      setEnrollment(e);
      // Open first module by default
      if (c.modules?.[0]) setExpanded({ [c.modules[0].id]: true });
      // Start from first incomplete, non-locked lesson
      const allLessons = flatLessons(c);
      const completedSet = new Set(
        e.lessonProgress?.filter((p: { completed: boolean }) => p.completed).map((p: { lessonId: string }) => p.lessonId),
      );
      const requested = initialLessonRef.current
        ? allLessons.find((l) => l.id === initialLessonRef.current)
        : undefined;
      const first = requested ?? allLessons.find((l) => !completedIds.has(l.id)) ?? allLessons[0];
      if (first) {
        setActiveLesson(first);
        const owner = c.modules?.find((m) => m.lessons.some((l) => l.id === first.id));
        const open = owner ?? c.modules?.[0];
        if (open) setExpanded({ [open.id]: true });
      }    })
      const first = allLessons.find((l) => {
        if (completedSet.has(l.id)) return false;
        const modIdx = c.modules?.findIndex((m) => m.lessons.some((ml) => ml.id === l.id)) ?? -1;
        if (modIdx !== -1 && c.modules) {
          const lock = getModuleLockInfo(c.modules[modIdx], modIdx, c.modules, completedSet);
          if (lock.isLocked) return false;
        }
        return true;
      }) ?? allLessons[0];
      if (first) setActiveLesson(first);
    })
    .catch((err) => {
      console.error(err);
      const status = (err as { response?: { status?: number }; status?: number })?.response?.status ?? (err as { status?: number })?.status;
      if (status === 404) {
        setLoadError('notFound');
      } else {
        setLoadError('network');
      }
    })
    .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCourseData();
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [loadCourseData]);

  // ── Course completion detection ──────────────────────────────────────────
  useEffect(() => {
    if (!course || !enrollment) return;

    const totalLessons = flatLessons(course).length;
    const completedCount = enrollment.lessonProgress?.filter((p: { completed: boolean }) => p.completed).length ?? 0;
    const isComplete = totalLessons > 0 && completedCount >= totalLessons;
    const previouslyIncomplete =
      previousCompletedCountRef.current === null ||
      previousCompletedCountRef.current < totalLessons;
    const newlyCompleted =
      hasInitializedCompletionState.current && previouslyIncomplete && isComplete;

    previousCompletedCountRef.current = completedCount;
    hasInitializedCompletionState.current = true;

    if (!isComplete) {
      setShowCompletionModal(false);
      return;
    }

    const storageKey = `course-completion:${course.id}`;
    const hasSeenModal =
      typeof window !== 'undefined' &&
      window.localStorage.getItem(storageKey) === 'true';

    if (newlyCompleted && !hasSeenModal) {
      setShowCompletionModal(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, "true");
      }
    } else {
      setShowCompletionModal(false);
    }
  }, [course, enrollment]);

  // ── Dismiss countdown when lesson changes (e.g. sidebar click) ──────────
  useEffect(() => {
    setShowCountdown(false);
    setMarkError(null);
  }, [activeLesson]);

  // Follow ?lesson= changes (back/forward, manual URL edits)
  useEffect(() => {
    if (!course || !lessonParam || activeLesson?.id === lessonParam) return;
    const match = flatLessons(course).find((l) => l.id === lessonParam);
    if (!match) return;
    setActiveLesson(match);
    const owner = course.modules?.find((m) => m.lessons.some((l) => l.id === match.id));
    if (owner) setExpanded((p) => ({ ...p, [owner.id]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonParam, course]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isLessonCompleted = (lessonId: string) =>
    enrollment?.lessonProgress?.some(
      (p: { lessonId: string; completed: boolean }) => p.lessonId === lessonId && p.completed,
    ) ?? false;

  const handleMarkComplete = useCallback(async () => {
    if (!activeLesson || !enrollment || marking) return;
    setMarking(true);
    setMarkError(null);
    try {
      await lessonsApi.markComplete(activeLesson.id, enrollment.id);
      const updated = await enrollmentsApi.get(id);
      setEnrollment(updated);
    } catch (err) {
      console.error(err);
      setMarkError('Failed to mark lesson as complete. Please try again.');
    } finally {
      setMarking(false);
    }
  }, [activeLesson, enrollment, marking, id]);

  // ── Focus mode state & keyboard shortcuts (Issue #404) ────────────────────
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === 'true';
  });

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocusMode(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, 'false');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
      } else if (e.key === 'Escape' && focusMode) {
        e.preventDefault();
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode, exitFocusMode, focusMode]);

  // ── Reading progress & estimated read time (Issue #405) ───────────────────
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const hasAutoCompletedRef = useRef(false);

  const { wordCount, readTimeMinutes } = useMemo(() => {
    if (!activeLesson?.content) return { wordCount: 0, readTimeMinutes: 1 };
    const plainText = activeLesson.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText ? plainText.split(' ').filter(Boolean).length : 0;
    const mins = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
    return { wordCount: words, readTimeMinutes: mins };
  }, [activeLesson?.content]);

  useEffect(() => {
    hasAutoCompletedRef.current = false;
    setReadingProgress(0);
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [activeLesson?.id]);

  const handleScroll = useCallback(() => {
    const el = contentScrollRef.current;
    if (!el || activeLesson?.type !== 'TEXT') return;

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight <= 0) {
      setReadingProgress(100);
      return;
    }

    const currentPercent = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
    setReadingProgress(currentPercent);

    if (currentPercent >= 95 && !hasAutoCompletedRef.current) {
      hasAutoCompletedRef.current = true;
      if (activeLesson && !isLessonCompleted(activeLesson.id)) {
        handleMarkComplete();
        toast.success({
          title: 'Lesson Completed',
          description: 'You finished reading this lesson!',
        });
      }
    }
  }, [activeLesson, isLessonCompleted, handleMarkComplete, toast]);

  const totalLessons   = course ? flatLessons(course).length : 0;
  const completedCount = enrollment?.lessonProgress?.filter((p: { completed: boolean }) => p.completed).length ?? 0;
  const progress       = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
    </div>
  );

  if (loadError === 'network') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-ink-700 font-medium mb-3">Failed to load course. Please check your connection.</p>
        <button
          onClick={loadCourseData}
          className="btn-primary inline-flex items-center gap-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loadError === 'notFound' || !course)
    return (
      <div className="text-center py-16 text-ink-500">Course not found.</div>
    );

  return (
    <div className="-m-3 flex h-[calc(100vh-4rem)] flex-col overflow-hidden sm:-m-6 md:flex-row">
      {course && (
        <CourseCompletionModal
          open={showCompletionModal}
          courseTitle={course.title}
          courseId={course.id}
          onClose={() => setShowCompletionModal(false)}
        />
      )}

      {/* ── Lesson sidebar ──────────────────────────────────────────────── */}
      <aside className={cn(
        "w-72 bg-white border-r border-ink-100 flex flex-col flex-shrink-0 overflow-y-auto transition-all duration-200",
        focusMode && "hidden md:hidden"
      )}>
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-expanded={sidebarOpen}
        aria-controls="learn-curriculum"
        className="md:hidden flex flex-shrink-0 items-center justify-between border-b border-ink-100 bg-white px-4 py-3 text-sm font-medium text-ink-700"
      >
        <span>Course content</span>
        {sidebarOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <aside
        id="learn-curriculum"
        className={cn(
          sidebarOpen ? 'flex' : 'hidden',
          'md:flex w-full max-h-[40vh] md:max-h-none md:w-72 flex-col flex-shrink-0 overflow-y-auto',
          'bg-white border-b border-ink-100 md:border-b-0 md:border-r',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-ink-100">
          <Link
            href={`/dashboard/courses/${id}`}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to overview
          </Link>
          <h2 className="text-sm font-semibold text-ink-900 line-clamp-2">{course.title}</h2>
          <div className="mt-2.5">
            <div className="flex justify-between text-xs text-ink-400 mb-1">
              <span>{completedCount}/{totalLessons} lessons</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Sidebar tab switcher */}
        <div className="flex border-b border-ink-100 text-xs font-medium">
          {(['lessons', 'notes', 'qa'] as SidebarTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={cn(
                'flex-1 py-2 capitalize transition-colors',
                sidebarTab === tab
                  ? 'text-saffron-700 border-b-2 border-saffron-500'
                  : 'text-ink-400 hover:text-ink-700',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Modules + lessons */}
        {sidebarTab === "lessons" && (
          <div className="flex-1">
            {course.modules?.map((module, mIdx) => {
              const lockInfo = getModuleLockInfo(module, mIdx, course.modules ?? [], completedIds);
              const isLocked = lockInfo.isLocked;

              return (
              <div key={module.id} className="border-b border-ink-50">
                <button
                  onClick={() =>
                    setExpanded((p) => ({ ...p, [module.id]: !p[module.id] }))
                  }
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink-700 truncate">{module.title}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isLocked ? (
                    <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-200 flex-shrink-0">
                      <Lock className="w-3 h-3" />
                      <span>{lockInfo.reason}</span>
                    </div>
                  ) : expanded[module.id] ? (
                    <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  )}
                </button>

                {expanded[module.id] && (
                  <div className="pb-1">
                    {module.lessons.map((lesson) => {
                      const done   = isLessonCompleted(lesson.id);
                      const active = activeLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          onClick={() => {
                            if (isLocked) {
                              toast.warning({
                                title: 'Lesson Locked',
                                description: lockInfo.reason || 'Complete previous module to unlock this lesson.',
                              });
                              return;
                            }
                            setActiveLesson(lesson);
                          }}
                          className={cn(
                            'w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors',
                            active ? 'bg-saffron-50' : 'hover:bg-ink-50',
                            isLocked && 'opacity-80 cursor-not-allowed',
                          )}
                        >
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          ) : done ? (
                            <CheckCircle2 className="w-4 h-4 text-leaf-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle
                              className={cn(
                                'w-4 h-4 flex-shrink-0 mt-0.5',
                                active ? 'text-saffron-500' : 'text-ink-300',
                              )}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-xs leading-snug',
                                active
                                  ? 'font-semibold text-saffron-700'
                                  : isLocked
                                    ? 'text-ink-400'
                                    : done
                                      ? 'text-ink-500'
                                      : 'text-ink-700',
                              )}
                            >
                              {lesson.title}
                            </p>
                            {isLocked && lockInfo.reason ? (
                              <p className="text-[10px] text-amber-600 mt-0.5">
                                {lockInfo.reason}
                              </p>
                            ) : lesson.videoDuration ? (
                              <p className="text-[10px] text-ink-400 mt-0.5">
                                {formatDuration(lesson.videoDuration)}
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}

        {sidebarTab === "notes" && activeLesson && (
          <div className="flex-1 overflow-hidden">
            <NotesPanel
              courseId={id}
              lectureId={activeLesson.id}
              videoRef={videoRef}
              courseTitle={course.title}
              lectureTitle={activeLesson.title}
            />
          </div>
        )}

        {sidebarTab === "qa" && (
          <div className="flex-1 flex items-center justify-center text-ink-400 px-4">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Q&amp;A coming soon</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main lesson content ──────────────────────────────────────────── */}
      <div
        ref={contentScrollRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto p-6 transition-all duration-200",
          focusMode && "p-4 sm:p-8"
        )}
      >
        {activeLesson ? (
          <div className={cn("max-w-3xl mx-auto", focusMode && "max-w-4xl")}>
            {/* Focus Mode Banner (active) */}
            {focusMode && (
              <div className="sticky top-0 z-30 mb-4 flex items-center justify-between rounded-xl bg-ink-900/90 px-4 py-2.5 text-white shadow-lg backdrop-blur-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-saffron-400 animate-pulse" />
                  <span className="text-xs font-medium text-ink-100">Focus Mode</span>
                  <span className="hidden sm:inline text-[10px] text-ink-400 font-mono">(Press Esc to exit)</span>
                </div>
                <button
                  type="button"
                  onClick={exitFocusMode}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                  aria-label="Exit Focus Mode"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit Focus
                </button>
              </div>
            )}

            {/* Breadcrumb — sits above the lesson content */}
            {!focusMode && (
              <Breadcrumb
                items={[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "My Courses", href: "/dashboard/courses" },
                  { label: course.title, href: `/dashboard/courses/${id}` },
                  { label: activeLesson.title },
                ]}
                className="mb-5"
              />
            )}

            {/* Video */}
            {activeLesson.videoUrl && (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-5">
                <VideoPlayer
                  key={activeLesson.videoUrl}
                  ref={videoRef}
                  src={activeLesson.videoUrl}
                  videoQualities={activeLesson.videoQualities}
                  enrollmentId={enrollment?.id}
                  lessonId={activeLesson.id}
                  autoplay={autoplay}
                  onAutoplayChange={handleAutoplayChange}
                  onEnded={handleVideoEnded}
                  className="w-full h-full"
                />

                {/* Autoplay countdown overlay */}
                {showCountdown && nextLesson && (
                  <AutoplayCountdown
                    nextTitle={nextLesson.title}
                    seconds={5}
                    onComplete={goToNext}
                    onCancel={cancelCountdown}
                  />
                )}
              </div>
            )}

            {/* Step-by-step practical checklist */}
            {activeLesson.steps && activeLesson.steps.length > 0 && (
              <StepChecklist
                key={activeLesson.id}
                lessonId={activeLesson.id}
                steps={activeLesson.steps}
                onSeek={handleSeek}
                className="mb-5"
              />
            )}

            {/* Text content with Reading Progress Bar & Read Time Estimate (Issue #405) */}
            {activeLesson.type === "TEXT" && activeLesson.content && (
              <div className="relative mb-5">
                {/* Sticky Reading Progress Indicator */}
                <div className="sticky top-0 z-20 mb-3 rounded-xl border border-ink-100 bg-white/95 p-3 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-medium text-saffron-800">
                      <Clock className="w-3.5 h-3.5 text-saffron-600" />
                      {readTimeMinutes} min read ({wordCount} words)
                    </span>
                    <span className="font-mono text-[11px] text-ink-500 font-medium">
                      {readingProgress}% read
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-saffron-500 transition-all duration-150"
                      style={{ width: `${readingProgress}%` }}
                      role="progressbar"
                      aria-valuenow={readingProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>

                <div className="card p-6 prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeLesson.content) }}
                  />
                </div>
              </div>
            )}

            {/* Quiz / assessment */}
            {activeLesson.type === "QUIZ" && (
              <div className="mb-5">
                <QuizComponent
                  questions={activeLesson.quiz ?? DEFAULT_QUIZ_QUESTIONS}
                  onContinue={
                    nextLesson ? () => selectLesson(nextLesson) : undefined
                  }
                />
              </div>
            )}

            {/* Title + controls row (Focus Mode + Mark complete) */}
            <div className="flex items-start justify-between mb-5 gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl font-semibold text-ink-900 mb-1">
                  {activeLesson.title}
                </h1>
                {activeLesson.description && (
                  <p className="text-sm text-ink-500">
                    {activeLesson.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                {/* Focus mode toggle button (Issue #404) */}
                <button
                  type="button"
                  onClick={toggleFocusMode}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-colors shadow-sm"
                  title={focusMode ? "Exit Focus Mode (Esc)" : "Enter Focus Mode (F)"}
                  aria-label="Toggle Focus Mode"
                >
                  {focusMode ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-ink-500" />
                      <span className="hidden sm:inline">Exit Focus</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-ink-500" />
                      <span className="hidden sm:inline">Focus Mode</span>
                      <kbd className="hidden sm:inline-block rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono text-ink-500">
                        F
                      </kbd>
                    </>
                  )}
                </button>

                <div className="flex flex-col items-end">
                  {!isLessonCompleted(activeLesson.id) ? (
                    <button
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="btn-leaf flex-shrink-0"
                    >
                      {marking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Mark complete
                    </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-leaf-600 bg-leaf-50 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
                {markError && (
                  <p role="alert" className="mt-2 text-xs text-rose-500 text-right">
                    {markError}
                  </p>
                )}
              </div>
            </div>
          </div>

            {activeLesson.type === 'ASSIGNMENT' && (
              <AssignmentSubmission key={activeLesson.id} lesson={activeLesson} />
            )}

            {/* Downloadable resource */}
            {activeLesson.resourceUrl && (
              <a
                href={activeLesson.resourceUrl}
                download
                className="btn-secondary inline-flex mb-5"
              >
                <Download className="w-4 h-4" />
                Download lesson resource
              </a>
            )}

            {/* Next lecture button (shown when autoplay is OFF and there's no video) */}
            {!autoplay && nextLesson && !activeLesson.videoUrl && (
              <div className="flex justify-end mb-5">
                <button
                  onClick={goToNext}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Next lecture
                </button>
              </div>
            )}

            {/* Completion celebration */}
            {progress === 100 && !showCompletionModal && (
              <div className="card p-6 bg-gradient-to-br from-saffron-50 to-leaf-50 border-saffron-100 text-center">
                <div className="text-4xl mb-3">🎓</div>
                <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">
                  Course complete!
                </h2>
                <p className="text-sm text-ink-500 mb-4">
                  You&apos;ve finished all lessons. Your certificate will be
                  issued shortly.
                </p>
                <Link
                  href="/dashboard/certificates"
                  className="btn-primary inline-flex"
                >
                  <Award className="w-4 h-4" />
                  View my certificates
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-ink-400">
            <p className="text-sm">Select a lesson to start learning</p>
          </div>
        )}
      </div>
    </div>
  );
}

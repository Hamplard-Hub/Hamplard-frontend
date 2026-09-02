"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  ArrowLeft,
  Award,
  SkipForward,
  MessageSquare,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { coursesApi, enrollmentsApi, lessonsApi } from "@/lib/api/services";
import { formatDuration, cn } from "@/lib/utils";
import CourseCompletionModal from "@/components/learn/CourseCompletionModal";
import { VideoPlayer } from "@/components/learn/VideoPlayer";
import { AutoplayCountdown } from "@/components/learn/AutoplayCountdown";
import NotesPanel from "@/components/learn/NotesPanel";
import QuizComponent from "@/components/learn/QuizComponent";
import { Breadcrumb } from "@/components/ui";
import type { Course, Enrollment, Lesson, QuizQuestion } from "@/types";

type SidebarTab = "lessons" | "notes" | "qa";

// ── Constants ──────────────────────────────────────────────────────────────
const AUTOPLAY_STORAGE_KEY = "hamplard:autoplay";

const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "default-1",
    type: "multiple_choice",
    question: "What does the Stellar network primarily do?",
    options: [
      { id: "a", text: "Mine new coins", isCorrect: false },
      {
        id: "b",
        text: "Facilitate fast, low-cost cross-border payments",
        isCorrect: true,
      },
      { id: "c", text: "Host smart contracts only", isCorrect: false },
    ],
    explanation:
      "Stellar is a payment-focused blockchain network built for fast, low-cost transfers.",
  },
  {
    id: "default-2",
    type: "multi_select",
    question: "Which of the following are Stellar-native assets?",
    options: [
      { id: "a", text: "XLM (Lumens)", isCorrect: true },
      { id: "b", text: "Issued credit assets", isCorrect: true },
      { id: "c", text: "Bitcoin", isCorrect: false },
      { id: "d", text: "Ether", isCorrect: false },
    ],
    explanation:
      "XLM and issued credit assets are native to Stellar; Bitcoin and Ether exist on other networks.",
  },
  {
    id: "default-3",
    type: "true_false",
    question: "Stellar transactions are finalized in seconds, not minutes.",
    explanation:
      "The Stellar network settles transactions in roughly 3-5 seconds.",
  },
];

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
  const requestedLessonId = searchParams.get("lesson");

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("lessons");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ── Autoplay state ───────────────────────────────────────────────────────
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(AUTOPLAY_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [showCountdown, setShowCountdown] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previousCompletedCountRef = useRef<number | null>(null);
  const hasInitializedCompletionState = useRef(false);

  // ── Derived: next lesson ─────────────────────────────────────────────────
  const nextLesson = useMemo<Lesson | null>(() => {
    if (!course || !activeLesson) return null;
    const all = flatLessons(course);
    const idx = all.findIndex((l) => l.id === activeLesson.id);
    return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  }, [course, activeLesson]);

  const selectLesson = useCallback(
    (lesson: Lesson) => {
      setActiveLesson(lesson);
      const params = new URLSearchParams(searchParams.toString());
      params.set("lesson", lesson.id);
      router.replace(`/dashboard/courses/${id}/learn?${params.toString()}`, {
        scroll: false,
      });
    },
    [id, router, searchParams],
  );

  // ── Persist autoplay preference ──────────────────────────────────────────
  const handleAutoplayChange = useCallback((enabled: boolean) => {
    setAutoplay(enabled);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(enabled));
    }
    // If the user turns autoplay off while the countdown is visible, cancel it
    if (!enabled) setShowCountdown(false);
  }, []);

  // ── Video ended handler ──────────────────────────────────────────────────
  const handleVideoEnded = useCallback(() => {
    if (autoplay && nextLesson) {
      setShowCountdown(true);
    }
    // If autoplay is off or there's no next lesson the video just stops
  }, [autoplay, nextLesson]);

  // ── Navigate to next lecture ─────────────────────────────────────────────
  const goToNext = useCallback(() => {
    if (!nextLesson) return;
    setShowCountdown(false);
    selectLesson(nextLesson);
  }, [nextLesson, selectLesson]);

  const cancelCountdown = useCallback(() => {
    setShowCountdown(false);
  }, []);

  // ── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([coursesApi.get(id), enrollmentsApi.get(id)])
      .then(([c, e]) => {
        setCourse(c);
        setEnrollment(e);
        // Open first module by default
        if (c.modules?.[0]) setExpanded({ [c.modules[0].id]: true });
        // Start from first incomplete lesson
        const allLessons = flatLessons(c);
        const completedIds = new Set(
          e.lessonProgress
            ?.filter((p: { completed: boolean }) => p.completed)
            .map((p: { lessonId: string }) => p.lessonId),
        );
        const requested = allLessons.find((l) => l.id === requestedLessonId);
        const first =
          requested ??
          allLessons.find((l) => !completedIds.has(l.id)) ??
          allLessons[0];
        if (first) setActiveLesson(first);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [id, requestedLessonId]);

  // ── Course completion detection ──────────────────────────────────────────
  useEffect(() => {
    if (!course || !enrollment) return;

    const totalLessons = flatLessons(course).length;
    const completedCount =
      enrollment.lessonProgress?.filter(
        (p: { completed: boolean }) => p.completed,
      ).length ?? 0;
    const isComplete = totalLessons > 0 && completedCount >= totalLessons;
    const previouslyIncomplete =
      previousCompletedCountRef.current === null ||
      previousCompletedCountRef.current < totalLessons;
    const newlyCompleted =
      hasInitializedCompletionState.current &&
      previouslyIncomplete &&
      isComplete;

    previousCompletedCountRef.current = completedCount;
    hasInitializedCompletionState.current = true;

    if (!isComplete) {
      setShowCompletionModal(false);
      return;
    }

    const storageKey = `course-completion:${course.id}`;
    const hasSeenModal =
      typeof window !== "undefined" &&
      window.localStorage.getItem(storageKey) === "true";

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
  }, [activeLesson]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isLessonCompleted = (lessonId: string) =>
    enrollment?.lessonProgress?.some(
      (p: { lessonId: string; completed: boolean }) =>
        p.lessonId === lessonId && p.completed,
    ) ?? false;

  const handleMarkComplete = async () => {
    if (!activeLesson || !enrollment || marking) return;
    setMarking(true);
    try {
      await lessonsApi.markComplete(activeLesson.id, enrollment.id);
      const updated = await enrollmentsApi.get(id);
      setEnrollment(updated);
    } finally {
      setMarking(false);
    }
  };

  const totalLessons = course ? flatLessons(course).length : 0;
  const completedCount =
    enrollment?.lessonProgress?.filter(
      (p: { completed: boolean }) => p.completed,
    ).length ?? 0;
  const progress =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
      </div>
    );

  if (!course)
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
      <aside className="flex max-h-[42vh] w-full flex-shrink-0 flex-col border-b border-ink-100 bg-white md:max-h-none md:w-72 md:border-b-0 md:border-r">
        <div className="flex border-b border-ink-100">
          {(
            [
              {
                tab: "lessons" as SidebarTab,
                icon: <Circle className="w-3.5 h-3.5" />,
                label: "Lessons",
              },
              {
                tab: "notes" as SidebarTab,
                icon: <FileText className="w-3.5 h-3.5" />,
                label: "Notes",
              },
              {
                tab: "qa" as SidebarTab,
                icon: <MessageSquare className="w-3.5 h-3.5" />,
                label: "Q&A",
              },
            ] as const
          ).map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-3 transition-colors",
                sidebarTab === tab
                  ? "text-saffron-600 border-b-2 border-saffron-500"
                  : "text-ink-400 hover:text-ink-600",
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {sidebarTab === "lessons" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-ink-100">
              <Link
                href={`/dashboard/courses/${id}`}
                className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 mb-2 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to overview
              </Link>
              <h2 className="text-sm font-semibold text-ink-900 line-clamp-2">
                {course.title}
              </h2>
              <div className="mt-2.5">
                <div className="flex justify-between text-xs text-ink-400 mb-1">
                  <span>
                    {completedCount}/{totalLessons} lessons
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {course.modules?.map((module, mi) => (
                <div key={module.id} className="border-b border-ink-50">
                  <button
                    onClick={() =>
                      setExpanded((previous) => ({
                        ...previous,
                        [module.id]: !previous[module.id],
                      }))
                    }
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink-700">
                        Module {mi + 1}: {module.title}
                      </p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {
                          module.lessons.filter((lesson) =>
                            isLessonCompleted(lesson.id),
                          ).length
                        }
                        /{module.lessons.length} done
                      </p>
                    </div>
                    {expanded[module.id] ? (
                      <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
                    )}
                  </button>

                  {expanded[module.id] && (
                    <div className="pb-1">
                      {module.lessons.map((lesson) => {
                        const done = isLessonCompleted(lesson.id);
                        const active = activeLesson?.id === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={cn(
                              "w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors",
                              active ? "bg-saffron-50" : "hover:bg-ink-50",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-leaf-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle
                                className={cn(
                                  "w-4 h-4 flex-shrink-0 mt-0.5",
                                  active ? "text-saffron-500" : "text-ink-300",
                                )}
                              />
                            )}
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-xs leading-snug",
                                  active
                                    ? "font-semibold text-saffron-700"
                                    : done
                                      ? "text-ink-500"
                                      : "text-ink-700",
                                )}
                              >
                                {lesson.title}
                              </p>
                              {lesson.videoDuration && (
                                <p className="text-[10px] text-ink-400 mt-0.5">
                                  {formatDuration(lesson.videoDuration)}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sidebarTab === "notes" && activeLesson && (
          <div className="flex-1 overflow-hidden">
            <NotesPanel
              courseId={id}
              lectureId={activeLesson.id}
              videoRef={videoRef}
            />
          </div>
        )}

        {sidebarTab === "qa" && (
          <div className="flex-1 flex items-center justify-center text-ink-400 px-4">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Q&A coming soon</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main lesson content ──────────────────────────────────────────── */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-6">
        {activeLesson ? (
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb ÔÇö sits above the lesson content */}
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "My Courses", href: "/dashboard/courses" },
                { label: course.title, href: `/dashboard/courses/${id}` },
                { label: activeLesson.title },
              ]}
              className="mb-5"
            />

            {/* Video */}
            {activeLesson.videoUrl && (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-5">
                <VideoPlayer
                  ref={videoRef}
                  key={activeLesson.videoUrl}
                  src={activeLesson.videoUrl}
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

            {/* Text content */}
            {activeLesson.type === "TEXT" && activeLesson.content && (
              <div className="card p-6 mb-5 prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
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

            {/* Title + mark complete row */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="font-display text-xl font-semibold text-ink-900 mb-1">
                  {activeLesson.title}
                </h1>
                {activeLesson.description && (
                  <p className="text-sm text-ink-500">
                    {activeLesson.description}
                  </p>
                )}
              </div>

              {!isLessonCompleted(activeLesson.id) ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className="btn-leaf flex-shrink-0 ml-4"
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
            </div>

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

            {/* Next lecture button (shown when autoplay is OFF and video has ended) */}
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
                <div className="text-4xl mb-3">­ƒÄô</div>
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

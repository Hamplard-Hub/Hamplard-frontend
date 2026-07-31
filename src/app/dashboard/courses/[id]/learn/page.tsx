"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Package,
  ChevronLeft,
} from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";

import { coursesApi, enrollmentsApi, lessonsApi } from "@/lib/api/services";

import type { Course, Enrollment, Lesson } from "@/types";

import NotesPanel from "@/components/learn/NotesPanel";
import QAPanel from "@/components/learn/QAPanel";
import CourseCompletionModal from "@/components/learn/CourseCompletionModal";
import { VideoPlayer } from "@/components/learn/VideoPlayer";

type RightTab = "notes" | "qa" | "resources";

export default function LearnPage() {
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);

  const [marking, setMarking] = useState(false);

  const [rightTab, setRightTab] = useState<RightTab>("notes");

  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [showSidebar, setShowSidebar] = useState(false);

  const previousCompletedCountRef = useRef<number | null>(null);

  const initializedCompletion = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    Promise.all([coursesApi.get(id), enrollmentsApi.get(id)])
      .then(([courseData, enrollmentData]) => {
        setCourse(courseData);
        setEnrollment(enrollmentData);

        if (courseData.modules?.length) {
          setExpanded({
            [courseData.modules[0].id]: true,
          });
        }

        const lessons = courseData.modules?.flatMap((m) => m.lessons) ?? [];

        const completedIds = new Set(
          enrollmentData.lessonProgress
            ?.filter((p) => p.completed)
            .map((p) => p.lessonId),
        );

        const firstLesson =
          lessons.find((l) => !completedIds.has(l.id)) ?? lessons[0];

        if (firstLesson) setActiveLesson(firstLesson);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isLessonCompleted = (lessonId: string) =>
    enrollment?.lessonProgress?.some(
      (p) => p.lessonId === lessonId && p.completed,
    ) ?? false;

  const allLessons = useMemo(
    () => course?.modules?.flatMap((m) => m.lessons) ?? [],
    [course],
  );

  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);

  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;

  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const totalLessons = allLessons.length;

  const completedCount =
    enrollment?.lessonProgress?.filter((p) => p.completed).length ?? 0;

  const progress =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

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

  useEffect(() => {
    if (!course || !enrollment) return;

    const completed =
      enrollment.lessonProgress?.filter((p) => p.completed).length ?? 0;

    const finished = completed >= totalLessons && totalLessons > 0;

    const wasIncomplete =
      previousCompletedCountRef.current === null ||
      previousCompletedCountRef.current < totalLessons;

    const newlyFinished =
      initializedCompletion.current && wasIncomplete && finished;

    previousCompletedCountRef.current = completed;

    initializedCompletion.current = true;

    if (!finished) {
      setShowCompletionModal(false);
      return;
    }

    const key = `course-completion:${course.id}`;

    const seen =
      typeof window !== "undefined" && localStorage.getItem(key) === "true";

    if (newlyFinished && !seen) {
      setShowCompletionModal(true);

      localStorage.setItem(key, "true");
    }
  }, [course, enrollment, totalLessons]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-saffron-500" />
      </div>
    );
  }

  if (!course) {
    return <div className="py-20 text-center">Course not found.</div>;
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-zinc-950">
        {/* LEFT SIDEBAR — COURSE CURRICULUM */}
        <aside
          className={cn(
            "bg-zinc-900 border-zinc-800",
            "w-full lg:w-80",
            "lg:flex-shrink-0",
            "border-b lg:border-b-0 lg:border-r",
            showSidebar ? "block" : "hidden lg:block",
          )}
        >
          {/* Header */}

          <div className="border-b border-zinc-800 p-5">
            <Link
              href={`/dashboard/courses/${id}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Course
            </Link>

            <h2 className="mt-4 text-lg font-semibold line-clamp-2">
              {course.title}
            </h2>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>
                  {completedCount}/{totalLessons} Lessons
                </span>

                <span>{progress}%</span>
              </div>

              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-saffron-500 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Curriculum */}

          <div className="flex-1 overflow-y-auto">
            {course.modules?.map((module, moduleIndex) => {
              const completedLessons = module.lessons.filter((lesson) =>
                isLessonCompleted(lesson.id),
              ).length;

              return (
                <div key={module.id} className="border-b border-zinc-900">
                  {/* Module */}

                  <button
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [module.id]: !prev[module.id],
                      }))
                    }
                    className="flex w-full items-center justify-between px-5 py-4 hover:bg-zinc-900 transition"
                  >
                    <div className="text-left">
                      <p className="font-medium">Module {moduleIndex + 1}</p>

                      <p className="text-sm text-zinc-400">{module.title}</p>

                      <p className="text-xs text-zinc-500 mt-1">
                        {completedLessons}/{module.lessons.length} completed
                      </p>
                    </div>

                    {expanded[module.id] ? (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>

                  {/* Lessons */}

                  {expanded[module.id] && (
                    <div>
                      {module.lessons.map((lesson) => {
                        const completed = isLessonCompleted(lesson.id);

                        const active = lesson.id === activeLesson?.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={cn(
                              "w-full flex items-start gap-3 px-5 py-3 text-left transition",

                              active
                                ? "bg-saffron-500/10 border-l-4 border-saffron-500"
                                : "hover:bg-zinc-900",
                            )}
                          >
                            {completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            ) : (
                              <Circle
                                className={cn(
                                  "w-5 h-5 mt-0.5 shrink-0",

                                  active ? "text-saffron-500" : "text-zinc-600",
                                )}
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "text-sm",

                                  active
                                    ? "font-semibold text-white"
                                    : "text-zinc-300",
                                )}
                              >
                                {lesson.title}
                              </p>

                              {lesson.videoDuration && (
                                <p className="mt-1 text-xs text-zinc-500">
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
              );
            })}
          </div>
        </aside>
        {/* MAIN CONTENT */}
        <main className="flex-1 flex-col bg-zinc-950 overflow-y-auto">
          {/* Breadcrumb */}

          <div className="border-b border-zinc-800 px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Link
                href="/dashboard/courses"
                className="hover:text-white transition"
              >
                Courses
              </Link>

              <span>/</span>

              <Link
                href={`/dashboard/courses/${id}`}
                className="hover:text-white transition"
              >
                {course.title}
              </Link>

              {activeLesson && (
                <>
                  <span>/</span>

                  <span className="text-white truncate">
                    {activeLesson.title}
                  </span>
                </>
              )}
            </div>
          </div>

          {activeLesson ? (
            <div className="mx-auto w-full max-w-7xl p-4 lg:p-8">
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="w-full rounded-lg bg-saffron-500 py-3 text-sm font-semibold text-white"
                >
                  {showSidebar ? "Hide Curriculum" : "Show Curriculum"}
                </button>
              </div>
              {/* VIDEO PLAYER */}
              {activeLesson.videoUrl && (
                <VideoPlayer
                  ref={videoRef}
                  src={activeLesson.videoUrl}
                  lessonId={activeLesson.id}
                  enrollmentId={enrollment?.id}
                  className="aspect-video w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl"
                  onComplete={async () => {
                    if (!isLessonCompleted(activeLesson.id) && enrollment) {
                      await lessonsApi.markComplete(
                        activeLesson.id,
                        enrollment.id,
                      );

                      const updated = await enrollmentsApi.get(id);

                      setEnrollment(updated);
                    }
                  }}
                />
              )}

              <div className="lg:hidden mt-4">
                <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-zinc-800">
                  <button
                    onClick={() => setRightTab("notes")}
                    className={cn(
                      "py-3 text-sm",
                      rightTab === "notes"
                        ? "bg-saffron-500 text-white"
                        : "bg-zinc-900 text-zinc-400",
                    )}
                  >
                    Notes
                  </button>

                  <button
                    onClick={() => setRightTab("qa")}
                    className={cn(
                      "py-3 text-sm",
                      rightTab === "qa"
                        ? "bg-saffron-500 text-white"
                        : "bg-zinc-900 text-zinc-400",
                    )}
                  >
                    Q&A
                  </button>

                  <button
                    onClick={() => setRightTab("resources")}
                    className={cn(
                      "py-3 text-sm",
                      rightTab === "resources"
                        ? "bg-saffron-500 text-white"
                        : "bg-zinc-900 text-zinc-400",
                    )}
                  >
                    Files
                  </button>
                </div>
              </div>

              {/* LESSON INFO */}
              <div className="mt-8 flex flex-col gap-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {activeLesson.title}
                    </h1>

                    {activeLesson.description && (
                      <p className="mt-3 max-w-4xl text-zinc-400 leading-relaxed">
                        {activeLesson.description}
                      </p>
                    )}
                  </div>

                  {!isLessonCompleted(activeLesson.id) ? (
                    <button
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="rounded-lg bg-saffron-500 px-5 py-3 font-medium text-white transition hover:bg-saffron-600 disabled:opacity-50"
                    >
                      {marking ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Mark Complete
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      Completed
                    </div>
                  )}
                </div>

                {/* TEXT LESSON */}
                {activeLesson.type === "TEXT" && activeLesson.content && (
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 prose prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: activeLesson.content,
                      }}
                    />
                  </div>
                )}

                {/* DOWNLOAD RESOURCE */}
                {activeLesson.resourceUrl && (
                  <a
                    href={activeLesson.resourceUrl}
                    download
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-white transition hover:bg-zinc-800"
                  >
                    <Download className="h-4 w-4" />
                    Download Lesson Resource
                  </a>
                )}

                {/* NAVIGATION */}
                <div className="mt-10 flex items-center justify-between border-t border-zinc-800 pt-8">
                  {previousLesson ? (
                    <button
                      onClick={() => setActiveLesson(previousLesson)}
                      className="rounded-lg border border-zinc-700 px-5 py-3 text-white transition hover:bg-zinc-800"
                    >
                      ← Previous Lesson
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextLesson ? (
                    <button
                      onClick={() => setActiveLesson(nextLesson)}
                      className="rounded-lg bg-saffron-500 px-5 py-3 font-medium text-white transition hover:bg-saffron-600"
                    >
                      Next Lesson →
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/certificates"
                      className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700"
                    >
                      Finish Course
                    </Link>
                  )}
                </div>

                {/* COURSE COMPLETE */}
                {progress === 100 && !showCompletionModal && (
                  <div className="rounded-2xl border border-green-700 bg-green-500/10 p-10 text-center">
                    <Award className="mx-auto h-14 w-14 text-green-400" />

                    <h2 className="mt-5 text-3xl font-bold text-white">
                      Congratulations 🎉
                    </h2>

                    <p className="mt-3 text-zinc-400">
                      You have successfully completed this course.
                    </p>

                    <Link
                      href="/dashboard/certificates"
                      className="mt-6 inline-flex rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
                    >
                      View Certificate
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500">
              Select a lesson to begin learning.
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900 flex flex-col h-[420px] lg:h-auto border-l">
          {/* Tabs */}

          <div className="flex overflow-x-auto border-b border-zinc-800">
            <button
              onClick={() => setRightTab("notes")}
              className={cn(
                "flex-1 min-w-[120px] py-4 text-sm font-medium transition",
                rightTab === "notes"
                  ? "border-b-2 border-saffron-500 text-white"
                  : "text-zinc-500 hover:text-white",
              )}
            >
              Notes
            </button>

            <button
              onClick={() => setRightTab("qa")}
              className={cn(
                "flex-1 min-w-[120px] py-4 text-sm font-medium transition",
                rightTab === "qa"
                  ? "border-b-2 border-saffron-500 text-white"
                  : "text-zinc-500 hover:text-white",
              )}
            >
              Q&A
            </button>

            <button
              onClick={() => setRightTab("resources")}
              className={cn(
                "flex-1 min-w-[120px] py-4 text-sm font-medium transition",
                rightTab === "resources"
                  ? "border-b-2 border-saffron-500 text-white"
                  : "text-zinc-500 hover:text-white",
              )}
            >
              Resources
            </button>
          </div>

          {/* Panel */}

          <div className="flex-1 overflow-hidden">
            {/* NOTES */}
            {rightTab === "notes" && activeLesson && (
              <NotesPanel
                courseId={id}
                lectureId={activeLesson.id}
                videoRef={videoRef}
              />
            )}

            {/* Q&A */}
            {rightTab === "qa" && activeLesson && (
              <QAPanel lessonId={activeLesson.id} />
            )}

            {/* RESOURCES */}
            {rightTab === "resources" && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white">
                  Lesson Resources
                </h3>

                <p className="mt-2 text-sm text-zinc-400">
                  Files attached to this lesson.
                </p>

                <div className="mt-8 space-y-4">
                  {activeLesson?.resourceUrl ? (
                    <a
                      href={activeLesson.resourceUrl}
                      download
                      className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 p-4 transition hover:border-saffron-500"
                    >
                      <div>
                        <p className="font-medium text-white">
                          Lesson Resource
                        </p>

                        <p className="text-sm text-zinc-500">
                          Download attachment
                        </p>
                      </div>

                      <Download className="h-5 w-5 text-saffron-400" />
                    </a>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
                      <Package className="mx-auto h-10 w-10 text-zinc-600" />

                      <p className="mt-4 text-sm text-zinc-500">
                        No resources available.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        <CourseCompletionModal
          open={showCompletionModal}
          courseTitle={course.title}
          courseId={course.id}
          onClose={() => setShowCompletionModal(false)}
        />
      </div>
    </>
  );
}

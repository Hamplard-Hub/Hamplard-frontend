'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Download, Loader2, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { coursesApi, enrollmentsApi, lessonsApi } from '@/lib/api/services';
import { formatDuration, cn } from '@/lib/utils';
import type { Course, Enrollment, Lesson, LessonProgress } from '@/types';

export default function LearnPage() {
  const { id } = useParams<{ id: string }>();

  const [course,      setCourse]      = useState<Course | null>(null);
  const [enrollment,  setEnrollment]  = useState<Enrollment | null>(null);
  const [activeLesson,setActiveLesson]= useState<Lesson | null>(null);
  const [expanded,    setExpanded]    = useState<Record<string, boolean>>({});
  const [loading,     setLoading]     = useState(true);
  const [marking,     setMarking]     = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([
      coursesApi.get(id),
      enrollmentsApi.get(id),
    ]).then(([c, e]) => {
      setCourse(c);
      setEnrollment(e);
      // Open first module by default
      if (c.modules?.[0]) setExpanded({ [c.modules[0].id]: true });
      // Start from first incomplete lesson
      const allLessons = c.modules?.flatMap((m) => m.lessons) ?? [];
      const completedIds = new Set(
        e.lessonProgress?.filter((p) => p.completed).map((p) => p.lessonId),
      );
      const first = allLessons.find((l) => !completedIds.has(l.id)) ?? allLessons[0];
      if (first) setActiveLesson(first);
    })
    .catch(console.error)
    .finally(() => setLoading(false));

    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [id]);

  const isLessonCompleted = (lessonId: string) =>
    enrollment?.lessonProgress?.some((p) => p.lessonId === lessonId && p.completed) ?? false;

  const handleMarkComplete = async () => {
    if (!activeLesson || !enrollment || marking) return;
    setMarking(true);
    try {
      await lessonsApi.markComplete(activeLesson.id, enrollment.id);
      // Re-fetch enrollment to update progress
      const updated = await enrollmentsApi.get(id);
      setEnrollment(updated);
    } finally {
      setMarking(false);
    }
  };

  const totalLessons   = course?.modules?.flatMap((m) => m.lessons).length ?? 0;
  const completedCount = enrollment?.lessonProgress?.filter((p) => p.completed).length ?? 0;
  const progress       = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
    </div>
  );

  if (!course) return <div className="text-center py-16 text-ink-500">Course not found.</div>;

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Lesson sidebar */}
      <aside className="w-72 bg-white border-r border-ink-100 flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-ink-100">
          <Link href={`/dashboard/courses/${id}`}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 mb-2 transition-colors">
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

        {/* Modules + lessons */}
        <div className="flex-1">
          {course.modules?.map((module, mi) => (
            <div key={module.id} className="border-b border-ink-50">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [module.id]: !p[module.id] }))}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-ink-700">
                    Module {mi + 1}: {module.title}
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5">
                    {module.lessons.filter((l) => isLessonCompleted(l.id)).length}/
                    {module.lessons.length} done
                  </p>
                </div>
                {expanded[module.id]
                  ? <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
                  : <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
                }
              </button>

              {expanded[module.id] && (
                <div className="pb-1">
                  {module.lessons.map((lesson) => {
                    const done    = isLessonCompleted(lesson.id);
                    const active  = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={cn(
                          'w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors',
                          active ? 'bg-saffron-50' : 'hover:bg-ink-50',
                        )}
                      >
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-leaf-500 flex-shrink-0 mt-0.5" />
                          : <Circle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', active ? 'text-saffron-500' : 'text-ink-300')} />
                        }
                        <div className="min-w-0">
                          <p className={cn(
                            'text-xs leading-snug',
                            active ? 'font-semibold text-saffron-700' : done ? 'text-ink-500' : 'text-ink-700',
                          )}>
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
      </aside>

      {/* Main lesson content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeLesson ? (
          <div className="max-w-3xl mx-auto">
            {/* Video */}
            {activeLesson.videoUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-5">
                <video
                  key={activeLesson.videoUrl}
                  src={activeLesson.videoUrl}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              </div>
            )}

            {/* Text content */}
            {activeLesson.type === 'TEXT' && activeLesson.content && (
              <div className="card p-6 mb-5 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
              </div>
            )}

            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="font-display text-xl font-semibold text-ink-900 mb-1">
                  {activeLesson.title}
                </h1>
                {activeLesson.description && (
                  <p className="text-sm text-ink-500">{activeLesson.description}</p>
                )}
              </div>

              {!isLessonCompleted(activeLesson.id) ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className="btn-leaf flex-shrink-0 ml-4"
                >
                  {marking
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />
                  }
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

            {/* Completion celebration */}
            {progress === 100 && (
              <div className="card p-6 bg-gradient-to-br from-saffron-50 to-leaf-50 border-saffron-100 text-center">
                <div className="text-4xl mb-3">🎓</div>
                <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">
                  Course complete!
                </h2>
                <p className="text-sm text-ink-500 mb-4">
                  You've finished all lessons. Your certificate will be issued shortly.
                </p>
                <Link href="/dashboard/certificates" className="btn-primary inline-flex">
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

// Need to import Award inside LearnPage
import { Award } from 'lucide-react';

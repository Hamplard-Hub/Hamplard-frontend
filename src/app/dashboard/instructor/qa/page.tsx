'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { apiClient } from '@/lib/api/client';
import { useToastContext } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';
import type { ApiResponse, Course, QnaQuestion, QnaReply } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) return <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── answer form ───────────────────────────────────────────────────────────

function AnswerForm({
  questionId,
  courseId,
  onAnswered,
}: {
  questionId: string;
  courseId: string;
  onAnswered: (reply: QnaReply) => void;
}) {
  const toast = useToastContext();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { data } = await apiClient.post<ApiResponse<QnaReply>>(
        `/courses/${courseId}/qa/${questionId}/replies`,
        { text: text.trim() },
      );
      onAnswered(data.data);
      setText('');
      toast.success({ title: 'Answer posted' });
    } catch {
      toast.error({ title: 'Failed to post answer', description: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Write your answer…"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        aria-label="Answer text"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden />
          {saving ? 'Posting…' : 'Post answer'}
        </button>
      </div>
    </form>
  );
}

// ── question card ─────────────────────────────────────────────────────────

function QuestionCard({
  question,
  courseTitle,
  courseId,
  onAnswered,
}: {
  question: QnaQuestion;
  courseTitle: string;
  courseId: string;
  onAnswered: (questionId: string, reply: QnaReply) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<QnaReply[]>(question.replies);

  const instructorReplied = replies.some((r) => r.isInstructor);

  const handleAnswered = (reply: QnaReply) => {
    setReplies((prev) => [...prev, reply]);
    onAnswered(question.id, reply);
  };

  return (
    <article
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
      aria-label={`Question: ${question.title}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={question.authorName} url={question.authorAvatarUrl} />

        <div className="flex-1 min-w-0">
          {/* meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {courseTitle}
            </span>
            <time className="text-xs text-gray-400" dateTime={question.createdAt}>
              {timeAgo(question.createdAt)}
            </time>
            {instructorReplied && (
              <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-3 h-3" aria-hidden /> Answered
              </span>
            )}
          </div>

          {/* title + expand */}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-left w-full"
            aria-expanded={expanded}
          >
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1">
              {question.title}
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" aria-hidden />
                : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" aria-hidden />}
            </p>
          </button>

          {expanded && (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{question.body}</p>

              {/* existing replies */}
              {replies.length > 0 && (
                <div className="space-y-2 ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                  {replies.map((reply) => (
                    <div key={reply.id} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {reply.authorName}
                        </span>
                        {reply.isInstructor && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            Instructor
                          </span>
                        )}
                        <time className="text-xs text-gray-400" dateTime={reply.createdAt}>
                          {timeAgo(reply.createdAt)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* answer form */}
              {!instructorReplied && (
                <AnswerForm
                  questionId={question.id}
                  courseId={courseId}
                  onAnswered={handleAnswered}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ── page ──────────────────────────────────────────────────────────────────

type FilterOption = 'all' | 'unanswered';

interface QnaItem {
  question: QnaQuestion;
  courseId: string;
  courseTitle: string;
}

export default function InstructorQAPage() {
  const toast = useToastContext();
  const [items, setItems] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>('unanswered');

  useEffect(() => {
    async function load() {
      try {
        const { data: courses } = await coursesApi.list({ limit: 100 });
        const allItems: QnaItem[] = [];

        await Promise.allSettled(
          courses.map(async (course) => {
            try {
              const { data } = await apiClient.get<ApiResponse<QnaQuestion[]>>(
                `/courses/${course.id}/qa`,
              );
              for (const q of data.data) {
                allItems.push({ question: q, courseId: course.id, courseTitle: course.title });
              }
            } catch {
              // skip courses we can't fetch
            }
          }),
        );

        // newest first
        allItems.sort(
          (a, b) => new Date(b.question.createdAt).getTime() - new Date(a.question.createdAt).getTime(),
        );
        setItems(allItems);
      } catch {
        toast.error({ title: 'Failed to load Q&A' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'unanswered') {
      return items.filter((item) => !item.question.replies.some((r) => r.isInstructor));
    }
    return items;
  }, [items, filter]);

  const unansweredCount = useMemo(
    () => items.filter((item) => !item.question.replies.some((r) => r.isInstructor)).length,
    [items],
  );

  const handleAnswered = (questionId: string, reply: QnaReply) => {
    setItems((prev) =>
      prev.map((item) =>
        item.question.id === questionId
          ? { ...item, question: { ...item.question, replies: [...item.question.replies, reply] } }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Q&A Inbox
          {unansweredCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold w-5 h-5">
              {unansweredCount > 99 ? '99+' : unansweredCount}
            </span>
          )}
        </h1>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
          {(['unanswered', 'all'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md font-medium transition-colors capitalize',
                filter === option
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
              aria-pressed={filter === option}
            >
              {option === 'unanswered' ? 'Unanswered' : 'All questions'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-label="Loading…" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" aria-hidden />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === 'unanswered' ? 'All questions have been answered.' : 'No questions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(({ question, courseId, courseTitle }) => (
            <QuestionCard
              key={question.id}
              question={question}
              courseTitle={courseTitle}
              courseId={courseId}
              onAnswered={handleAnswered}
            />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowBigUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Plus,
  Send,
} from 'lucide-react';

import { cn, timeAgo } from '@/lib/utils';
import { qnaApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { useToast } from '@/lib/hooks/use-toast';
import type { QnaQuestion, QnaSortOption } from '@/types';

interface QAPanelProps {
  lessonId: string;
}

const SORT_OPTIONS: { value: QnaSortOption; label: string }[] = [
  { value: 'most_recent', label: 'Most Recent' },
  { value: 'most_upvoted', label: 'Most Upvoted' },
  { value: 'unanswered', label: 'Unanswered' },
];

const isQuestionAnswered = (question: QnaQuestion) =>
  question.replies.some((reply) => reply.isInstructor);

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials =
    name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const sizeMap = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs' };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-zinc-800 font-semibold text-zinc-300',
        sizeMap[size],
      )}
    >
      {initials}
    </div>
  );
}

export default function QAPanel({ lessonId }: QAPanelProps) {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  const [questions, setQuestions] = useState<QnaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<QnaSortOption>('most_recent');
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setExpandedIds({});

    qnaApi
      .list(lessonId)
      .then((data) => {
        if (!cancelled) setQuestions(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const sortedQuestions = useMemo(() => {
    if (sortBy === 'unanswered') {
      return questions
        .filter((q) => !isQuestionAnswered(q))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const copy = [...questions];

    if (sortBy === 'most_upvoted') {
      return copy.sort((a, b) => b.upvotes - a.upvotes);
    }

    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [questions, sortBy]);

  const toggleExpanded = (questionId: string) => {
    setExpandedIds((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = async () => {
    const trimmed = questionText.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

    try {
      const question = await qnaApi.create(lessonId, {
        title: trimmed.slice(0, 120),
        body: trimmed,
      });

      setQuestions((prev) => [
        {
          ...question,
          authorName: user?.name ?? question.authorName,
          authorAvatarUrl: user?.avatarUrl ?? question.authorAvatarUrl,
        },
        ...prev,
      ]);

      setQuestionText('');
      setShowForm(false);

      toast.success({
        title: 'Question posted',
        description: 'Instructors and students can now answer.',
      });
    } catch {
      toast.error({
        title: 'Failed to post question',
        description: 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const viewerUpvoted = !q.viewerUpvoted;
        return { ...q, viewerUpvoted, upvotes: q.upvotes + (viewerUpvoted ? 1 : -1) };
      }),
    );

    try {
      await qnaApi.upvote(lessonId, questionId);
    } catch {
      // Optimistic update already applied; ignore best-effort sync failure.
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Questions & Answers</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Ask questions about this lecture.</p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-saffron-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-saffron-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Ask a question
        </button>
      </div>

      {/* Ask a question form */}
      {showForm && (
        <div className="border-b border-zinc-800 p-4">
          <textarea
            autoFocus
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Ask a question..."
            rows={3}
            className="min-h-24 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-saffron-500"
          />

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setQuestionText('');
              }}
              className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={!questionText.trim() || submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-saffron-600 disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Sort bar */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2.5">
          <span className="text-xs text-zinc-500">
            {sortedQuestions.length} question{sortedQuestions.length === 1 ? '' : 's'}
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as QnaSortOption)}
            aria-label="Sort questions"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-saffron-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Question list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-saffron-500" />
          </div>
        ) : sortedQuestions.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-zinc-500">
              {questions.length === 0 ? 'No questions yet.' : 'No unanswered questions.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {sortedQuestions.map((question) => {
              const answered = isQuestionAnswered(question);
              const expanded = !!expandedIds[question.id];
              const replyCount = question.replies.length;

              return (
                <li key={question.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {question.authorAvatarUrl ? (
                      <img
                        src={question.authorAvatarUrl}
                        alt={question.authorName}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <InitialsAvatar name={question.authorName} />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-medium text-white">
                          {question.authorName}
                        </span>

                        <span className="text-xs text-zinc-500">
                          {timeAgo(question.createdAt)}
                        </span>

                        {answered && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Answered
                          </span>
                        )}
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-300">
                        {question.body}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => handleUpvote(question.id)}
                          aria-pressed={question.viewerUpvoted}
                          aria-label={
                            question.viewerUpvoted ? 'Remove upvote' : 'Upvote this question'
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition',
                            question.viewerUpvoted
                              ? 'border-saffron-500 bg-saffron-500/10 text-saffron-400'
                              : 'border-zinc-700 text-zinc-400 hover:border-saffron-500 hover:text-saffron-400',
                          )}
                        >
                          <ArrowBigUp
                            className={cn('h-3.5 w-3.5', question.viewerUpvoted && 'fill-saffron-400')}
                          />
                          <span className="tabular-nums">{question.upvotes}</span>
                        </button>

                        <button
                          onClick={() => toggleExpanded(question.id)}
                          aria-expanded={expanded}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {replyCount} {replyCount === 1 ? 'answer' : 'answers'}
                          {expanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-3 border-l-2 border-zinc-800 pl-3">
                          {replyCount === 0 ? (
                            <p className="text-xs text-zinc-500">No answers yet.</p>
                          ) : (
                            question.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                {reply.authorAvatarUrl ? (
                                  <img
                                    src={reply.authorAvatarUrl}
                                    alt={reply.authorName}
                                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <InitialsAvatar name={reply.authorName} size="sm" />
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="text-xs font-medium text-white">
                                      {reply.authorName}
                                    </span>

                                    {reply.isInstructor && (
                                      <span className="rounded-full bg-saffron-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-saffron-400">
                                        Instructor
                                      </span>
                                    )}

                                    <span className="text-[10px] text-zinc-500">
                                      {timeAgo(reply.createdAt)}
                                    </span>
                                  </div>

                                  <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-zinc-300">
                                    {reply.text}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

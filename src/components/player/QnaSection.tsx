'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { QnaQuestionForm } from './QnaQuestionForm';
import { QnaFilterBar } from './QnaFilterBar';
import { QuestionCard } from './QuestionCard';
import type { QnaQuestion, QnaReply, QnaSortOption, QnaFilterOption } from '@/types';

interface QnaSectionProps {
  lessonTitle?: string;
  /** Initial set of questions for this lesson */
  questions: QnaQuestion[];
  /** Current viewer — used to tag newly-posted questions/replies as "You" */
  currentUser?: { name: string; avatarUrl?: string | null };
  /** Optional backend hooks — called before the optimistic local update */
  onSubmitQuestion?: (title: string, body: string) => Promise<void>;
  onSubmitReply?: (questionId: string, text: string) => Promise<void>;
  onUpvote?: (questionId: string) => Promise<void> | void;
  className?: string;
}

/**
 * QnaSection
 *
 * Full Q&A discussion block for the lesson video player. Composes:
 *  - QnaQuestionForm  (title + body submission)
 *  - QnaFilterBar     (search, sort by recent/upvoted, filter all/mine/unanswered)
 *  - QuestionCard[]   (question list, filtered + sorted, each with an
 *                      expandable reply thread and nested reply form)
 *
 * State is local so the section works standalone; the optional
 * onSubmitQuestion / onSubmitReply / onUpvote callbacks are called first
 * (awaited) so a real API call can run before the optimistic UI update.
 */
export function QnaSection({
  lessonTitle,
  questions: initialQuestions,
  currentUser = { name: 'You', avatarUrl: null },
  onSubmitQuestion,
  onSubmitReply,
  onUpvote,
  className,
}: QnaSectionProps) {
  const [questions, setQuestions] = useState<QnaQuestion[]>(initialQuestions);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<QnaSortOption>('most_recent');
  const [filterBy, setFilterBy] = useState<QnaFilterOption>('all');

  async function handleNewQuestion(title: string, body: string) {
    await onSubmitQuestion?.(title, body);
    const newQuestion: QnaQuestion = {
      id: `q-${Date.now()}`,
      authorName: currentUser.name,
      authorAvatarUrl: currentUser.avatarUrl ?? null,
      isViewerAuthor: true,
      title,
      body,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      viewerUpvoted: false,
      replies: [],
    };
    setQuestions((prev) => [newQuestion, ...prev]);
  }

  async function handleReply(questionId: string, text: string) {
    await onSubmitReply?.(questionId, text);
    const newReply: QnaReply = {
      id: `r-${Date.now()}`,
      authorName: currentUser.name,
      authorAvatarUrl: currentUser.avatarUrl ?? null,
      isInstructor: false,
      text,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, replies: [...q.replies, newReply] } : q)),
    );
  }

  function handleUpvote(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const nowUpvoted = !q.viewerUpvoted;
        return { ...q, viewerUpvoted: nowUpvoted, upvotes: q.upvotes + (nowUpvoted ? 1 : -1) };
      }),
    );
    void onUpvote?.(questionId);
  }

  // Filter by tab
  const tabFiltered = useMemo(() => {
    switch (filterBy) {
      case 'mine':
        return questions.filter((q) => q.isViewerAuthor);
      case 'unanswered':
        return questions.filter((q) => q.replies.length === 0);
      default:
        return questions;
    }
  }, [questions, filterBy]);

  // Filter by search keyword (title + body)
  const searched = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tabFiltered;
    return tabFiltered.filter(
      (q) => q.title.toLowerCase().includes(term) || q.body.toLowerCase().includes(term),
    );
  }, [tabFiltered, search]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...searched];
    if (sortBy === 'most_upvoted') {
      return copy.sort((a, b) => b.upvotes - a.upvotes);
    }
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [searched, sortBy]);

  return (
    <section className={cn('space-y-6', className)} aria-label="Lesson Q&A">
      <div>
        <h2 className="font-display text-lg font-semibold text-hamplard-deep">
          Questions & Answers
        </h2>
        {lessonTitle && (
          <p className="mt-1 text-sm text-semantic-text-muted">
            Ask about <span className="font-medium text-hamplard-deep">{lessonTitle}</span> — instructors and fellow students can help.
          </p>
        )}
      </div>

      <QnaQuestionForm onSubmit={handleNewQuestion} />

      {questions.length > 0 && (
        <QnaFilterBar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
          resultCount={sorted.length}
        />
      )}

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-semantic-border bg-semantic-bg-surface p-10 text-center">
          <p className="text-2xl mb-3" aria-hidden="true">💬</p>
          <p className="text-sm font-medium text-hamplard-deep mb-1">No questions yet</p>
          <p className="text-xs text-semantic-text-muted">
            Be the first to ask something about this lesson.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-semantic-border bg-semantic-bg-surface p-10 text-center">
          <p className="text-sm text-semantic-text-muted">
            No questions match{' '}
            {search ? <>“{search}”</> : filterBy === 'mine' ? 'your questions' : 'this filter'}.{' '}
            <button
              type="button"
              onClick={() => { setSearch(''); setFilterBy('all'); }}
              className="text-hamplard-primary hover:underline underline-offset-2 font-medium"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Question list">
          {sorted.map((question) => (
            <li key={question.id}>
              <QuestionCard question={question} onUpvote={handleUpvote} onReply={handleReply} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
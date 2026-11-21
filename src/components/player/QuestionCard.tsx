'use client';

import { useState } from 'react';
import { ArrowBigUp, MessageSquare, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QnaQuestion } from '@/types';

interface QuestionCardProps {
  question: QnaQuestion;
  defaultExpanded?: boolean;
  onUpvote: (questionId: string) => void;
  onReply: (questionId: string, text: string) => Promise<void>;
  className?: string;
}

/** Initials avatar used as fallback when no avatarUrl is provided. */
function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' };
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-full bg-hamplard-lilac text-hamplard-deep font-semibold flex items-center justify-center shrink-0',
        sizeMap[size],
      )}
    >
      {initials}
    </div>
  );
}

/** Relative timestamp label (e.g. "3 days ago"). */
function RelativeDate({ isoDate }: { isoDate: string }) {
  const date = new Date(isoDate);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  let label: string;
  if (diffDays <= 0) label = 'Today';
  else if (diffDays === 1) label = 'Yesterday';
  else if (diffDays < 7) label = `${diffDays} days ago`;
  else if (diffDays < 30) label = `${Math.floor(diffDays / 7)} weeks ago`;
  else if (diffDays < 365) label = `${Math.floor(diffDays / 30)} months ago`;
  else label = `${Math.floor(diffDays / 365)} years ago`;

  return (
    <time
      dateTime={isoDate}
      title={date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
      className="text-xs text-semantic-text-muted"
    >
      {label}
    </time>
  );
}

function InstructorBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded-full bg-hamplard-lilac text-hamplard-mid text-[10px] font-semibold tracking-wide uppercase">
      <MessageSquare className="w-2.5 h-2.5" aria-hidden="true" />
      Instructor
    </span>
  );
}

export function QuestionCard({
  question,
  defaultExpanded = false,
  onUpvote,
  onReply,
  className,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const replyCount = question.replies.length;
  const hasReplies = replyCount > 0;

  async function handleSubmitReply() {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onReply(question.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
      setExpanded(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article
      className={cn(
        'rounded-2xl border border-semantic-border bg-white p-5 transition-shadow duration-200 hover:shadow-md',
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        {question.authorAvatarUrl ? (
          <img
            src={question.authorAvatarUrl}
            alt={question.authorName}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <InitialsAvatar name={question.authorName} size="md" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-hamplard-deep truncate">
              {question.authorName}
            </span>
            {question.isViewerAuthor && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-semantic-text-muted">
                You
              </span>
            )}
            <RelativeDate isoDate={question.createdAt} />
          </div>
          <h3 className="mt-0.5 text-sm font-semibold text-hamplard-deep leading-snug">
            {question.title}
          </h3>
        </div>
      </div>

      {/* ── Question body ── */}
      <p className="mt-2.5 text-sm text-hamplard-deep/80 leading-relaxed whitespace-pre-line">
        {question.body}
      </p>

      {/* ── Footer: upvote + reply toggle ── */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-semantic-border">
        <button
          type="button"
          onClick={() => onUpvote(question.id)}
          aria-pressed={question.viewerUpvoted}
          aria-label={question.viewerUpvoted ? 'Remove upvote' : 'Upvote this question'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-offset-1',
            question.viewerUpvoted
              ? 'bg-hamplard-primary text-white border-hamplard-primary hover:bg-hamplard-mid hover:border-hamplard-mid'
              : 'bg-white text-hamplard-deep border-semantic-border hover:bg-hamplard-lilac hover:border-hamplard-primary',
          )}
        >
          <ArrowBigUp className={cn('w-3.5 h-3.5', question.viewerUpvoted && 'fill-white')} aria-hidden="true" />
          <span className="tabular-nums">{question.upvotes}</span>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-hamplard-deep hover:bg-hamplard-lilac transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => { setShowReplyForm((v) => !v); setExpanded(true); }}
          className="ml-auto text-xs font-medium text-hamplard-primary hover:text-hamplard-mid transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary rounded"
        >
          Reply
        </button>
      </div>

      {/* ── Replies thread ── */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {hasReplies ? (
            <ul className="space-y-3" aria-label={`Replies to ${question.title}`}>
              {question.replies.map((reply) => (
                <li
                  key={reply.id}
                  className={cn(
                    'flex items-start gap-2.5 ml-4 pl-4 border-l-2',
                    reply.isInstructor ? 'border-hamplard-primary/40' : 'border-semantic-border',
                  )}
                >
                  {reply.authorAvatarUrl ? (
                    <img
                      src={reply.authorAvatarUrl}
                      alt={reply.authorName}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <InitialsAvatar name={reply.authorName} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-semibold text-hamplard-deep">{reply.authorName}</span>
                      {reply.isInstructor && <InstructorBadge />}
                      <RelativeDate isoDate={reply.createdAt} />
                    </div>
                    <p className="mt-1 text-sm text-hamplard-deep/80 leading-relaxed whitespace-pre-line">
                      {reply.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-4 pl-4 border-l-2 border-semantic-border text-xs text-semantic-text-muted">
              No replies yet. Be the first to respond.
            </p>
          )}

          {/* ── Nested reply form ── */}
          {showReplyForm ? (
            <div className="ml-4 pl-4">
              <label htmlFor={`reply-${question.id}`} className="sr-only">
                Write a reply
              </label>
              <textarea
                id={`reply-${question.id}`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Write a reply…"
                className="w-full resize-y rounded-xl border border-semantic-border px-3.5 py-2.5 text-sm text-hamplard-deep leading-relaxed bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:border-hamplard-primary transition-colors"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || submitting}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    replyText.trim() && !submitting
                      ? 'bg-hamplard-primary text-white hover:bg-hamplard-mid'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  )}
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Post reply
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReplyForm(false); setReplyText(''); }}
                  className="text-xs font-medium text-semantic-text-muted hover:text-hamplard-deep transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            !hasReplies && (
              <button
                type="button"
                onClick={() => setShowReplyForm(true)}
                className="ml-4 pl-4 text-xs font-medium text-hamplard-primary hover:text-hamplard-mid transition-colors"
              >
                Write a reply
              </button>
            )
          )}
        </div>
      )}
    </article>
  );
}
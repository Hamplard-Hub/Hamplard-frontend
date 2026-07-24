'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  /** Force a specific display state for design documentation purposes */
  defaultExpanded?: boolean;
  className?: string;
}

/** Renders a filled/empty star row for a fixed 1–5 value. */
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          aria-hidden="true"
          className={cn(
            'w-3.5 h-3.5',
            s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
          )}
        />
      ))}
    </div>
  );
}

/** Initials avatar used as fallback when no avatarUrl is provided. */
function InitialsAvatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md';
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
  };

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
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  let label: string;
  if (diffDays === 0) label = 'Today';
  else if (diffDays === 1) label = 'Yesterday';
  else if (diffDays < 7) label = `${diffDays} days ago`;
  else if (diffDays < 30) label = `${Math.floor(diffDays / 7)} weeks ago`;
  else if (diffDays < 365) label = `${Math.floor(diffDays / 30)} months ago`;
  else label = `${Math.floor(diffDays / 365)} years ago`;

  return (
    <time
      dateTime={isoDate}
      title={date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      className="text-xs text-semantic-text-muted"
    >
      {label}
    </time>
  );
}

/**
 * ReviewCard
 *
 * Supports three visual states:
 *
 * 1. Default (collapsed) — avatar, name, stars, date, preview of text (line-clamp-3),
 *    helpful vote button.
 * 2. Expanded — full review text, "Show less" control.
 * 3. Instructor Reply — nested reply block appended beneath the review body.
 *
 * The component derives which visual state to render from runtime data:
 *  - `instructorReply` present  → state 3 (reply visible when expanded)
 *  - `defaultExpanded` prop     → forces expanded on first render
 *  - Otherwise defaults to collapsed.
 */
export function ReviewCard({ review, defaultExpanded = false, className }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [voted, setVoted] = useState(review.viewerVoted ?? false);
  const [voteCount, setVoteCount] = useState(review.helpfulVotes);

  const hasLongText = review.text.length > 250;
  const hasInstructorReply = !!review.instructorReply;

  function toggleVote() {
    if (voted) {
      setVoted(false);
      setVoteCount((c) => c - 1);
    } else {
      setVoted(true);
      setVoteCount((c) => c + 1);
    }
  }

  return (
    <article
      className={cn(
        'group rounded-2xl border border-semantic-border bg-white p-5 transition-shadow duration-200 hover:shadow-md',
        className,
      )}
    >
      {/* ── Header: avatar + name + stars + date ── */}
      <div className="flex items-start gap-3">
        {review.authorAvatarUrl ? (
          <img
            src={review.authorAvatarUrl}
            alt={review.authorName}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <InitialsAvatar name={review.authorName} size="md" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-hamplard-deep truncate">
              {review.authorName}
            </span>
            <RelativeDate isoDate={review.createdAt} />
          </div>
          <div className="mt-0.5">
            <StarDisplay rating={review.rating} />
          </div>
        </div>
      </div>

      {/* ── Review body ── */}
      <div className="mt-3">
        <p
          className={cn(
            'text-sm text-hamplard-deep/80 leading-relaxed',
            !expanded && hasLongText && 'line-clamp-3',
          )}
        >
          {review.text}
        </p>

        {/* Expand / collapse control */}
        {hasLongText && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-hamplard-primary hover:text-hamplard-mid transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary rounded"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Instructor Reply (visible when expanded or review is short) ── */}
      {hasInstructorReply && (expanded || !hasLongText) && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-hamplard-primary/30">
          {/* Reply header */}
          <div className="flex items-start gap-2.5">
            {review.instructorReply!.avatarUrl ? (
              <img
                src={review.instructorReply!.avatarUrl}
                alt={review.instructorReply!.name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <InitialsAvatar name={review.instructorReply!.name} size="sm" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs font-semibold text-hamplard-deep">
                  {review.instructorReply!.name}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded-full bg-hamplard-lilac text-hamplard-mid text-[10px] font-semibold tracking-wide uppercase">
                  <MessageSquare className="w-2.5 h-2.5" aria-hidden="true" />
                  Instructor
                </span>
                <RelativeDate isoDate={review.instructorReply!.repliedAt} />
              </div>

              <p className="mt-1.5 text-sm text-hamplard-deep/80 leading-relaxed">
                {review.instructorReply!.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer: helpful vote ── */}
      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-semantic-border">
        <span className="text-xs text-semantic-text-muted">Was this helpful?</span>

        <button
          type="button"
          onClick={toggleVote}
          aria-pressed={voted}
          aria-label={voted ? 'Remove helpful vote' : 'Mark review as helpful'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary focus-visible:ring-offset-1',
            voted
              ? 'bg-hamplard-primary text-white border-hamplard-primary hover:bg-hamplard-mid hover:border-hamplard-mid'
              : 'bg-white text-hamplard-deep border-semantic-border hover:bg-hamplard-lilac hover:border-hamplard-primary',
          )}
        >
          <ThumbsUp
            className={cn('w-3.5 h-3.5', voted && 'fill-white')}
            aria-hidden="true"
          />
          <span className="tabular-nums">{voteCount}</span>
        </button>

        {/* Instructor reply indicator (shown in collapsed state when reply exists) */}
        {hasInstructorReply && !expanded && hasLongText && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-hamplard-primary hover:text-hamplard-mid font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary rounded"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            Instructor replied
          </button>
        )}
      </div>
    </article>
  );
}

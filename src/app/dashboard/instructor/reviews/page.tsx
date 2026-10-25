'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Flag, MessageSquare, Pencil, Star, Trash2 } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { apiClient } from '@/lib/api/client';
import { useToastContext } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';
import type { ApiResponse, Course, Review } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')}
          aria-hidden
        />
      ))}
    </span>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) return <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </span>
  );
}

// ── inline reply form ─────────────────────────────────────────────────────

function ReplyForm({
  reviewId,
  initial,
  onSaved,
  onCancel,
}: {
  reviewId: string;
  initial?: string;
  onSaved: (text: string) => void;
  onCancel: () => void;
}) {
  const toast = useToastContext();
  const [text, setText] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiClient.post<ApiResponse<unknown>>(`/courses/reviews/${reviewId}/reply`, { text: text.trim() });
      onSaved(text.trim());
      toast.success({ title: 'Reply saved' });
    } catch {
      toast.error({ title: 'Failed to save reply', description: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Write your reply…"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        aria-label="Reply text"
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg px-4 py-1.5"
        >
          {saving ? 'Saving…' : initial ? 'Update reply' : 'Post reply'}
        </button>
      </div>
    </div>
  );
}

// ── review card ───────────────────────────────────────────────────────────

function ReviewCard({ review, onFlagToggle }: { review: Review; onFlagToggle: (id: string) => void }) {
  const [replyText, setReplyText] = useState(review.instructorReply?.text ?? '');
  const [editing, setEditing] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const hasReply = !!replyText;

  const handleSaved = (text: string) => {
    setReplyText(text);
    setEditing(false);
  };

  const handleDeleteReply = async () => {
    try {
      await apiClient.delete(`/courses/reviews/${review.id}/reply`);
      setReplyText('');
    } catch {
      // silently ignore — optimistic UI would need a toast here in production
    }
  };

  const handleFlag = () => {
    setFlagged((f) => !f);
    onFlagToggle(review.id);
  };

  return (
    <article
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3"
      aria-label={`Review by ${review.authorName}`}
    >
      {/* reviewer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={review.authorName} url={review.authorAvatarUrl} />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{review.authorName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} />
              <time className="text-xs text-gray-400" dateTime={review.createdAt}>
                {new Date(review.createdAt).toLocaleDateString()}
              </time>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleFlag}
          aria-label={flagged ? 'Unflag this review' : 'Flag this review as abusive'}
          title={flagged ? 'Flagged' : 'Flag as abusive'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            flagged
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
          )}
        >
          <Flag className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.text}</p>

      {/* instructor reply */}
      {hasReply && !editing ? (
        <div className="ml-4 pl-4 border-l-2 border-primary/30 space-y-1">
          <p className="text-xs font-semibold text-primary">Your reply</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{replyText}</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
            >
              <Pencil className="w-3 h-3" aria-hidden /> Edit
            </button>
            <button
              type="button"
              onClick={handleDeleteReply}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" aria-hidden /> Delete
            </button>
          </div>
        </div>
      ) : !editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden />
          Reply to this review
        </button>
      ) : null}

      {editing && (
        <ReplyForm
          reviewId={review.id}
          initial={replyText || undefined}
          onSaved={handleSaved}
          onCancel={() => setEditing(false)}
        />
      )}
    </article>
  );
}

// ── page ──────────────────────────────────────────────────────────────────

type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5';

export default function InstructorReviewsPage() {
  const toast = useToastContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const { data: courseData } = await coursesApi.list({ limit: 100 });
        setCourses(courseData);
        if (courseData.length > 0) {
          setSelectedCourseId(courseData[0].id);
        }
      } catch {
        toast.error({ title: 'Failed to load courses' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    apiClient
      .get<ApiResponse<Review[]>>(`/courses/${selectedCourseId}/reviews`)
      .then(({ data }) => setReviews(data.data))
      .catch(() => toast.error({ title: 'Failed to load reviews' }))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => ratingFilter === 'all' || r.rating === Number(ratingFilter));
  }, [reviews, ratingFilter]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const toggleFlag = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews</h1>

      {/* controls */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Select course"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by rating"
        >
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={String(n)}>{n} star{n !== 1 ? 's' : ''}</option>
          ))}
        </select>

        {avgRating && (
          <div className="flex items-center gap-1.5 ml-auto text-sm text-gray-600 dark:text-gray-400">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden />
            <span className="font-semibold text-gray-800 dark:text-gray-100">{avgRating}</span>
            <span>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
          </div>
        )}
      </div>

      {/* list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-label="Loading…" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
          No reviews {ratingFilter !== 'all' ? `with ${ratingFilter} stars ` : ''}yet.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} onFlagToggle={toggleFlag} />
          ))}
        </div>
      )}
    </div>
  );
}

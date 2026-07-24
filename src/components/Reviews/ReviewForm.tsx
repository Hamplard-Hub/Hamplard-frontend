'use client';

import { useState } from 'react';
import { Star, CheckCircle, Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Inline star selector ───────────────────────────────────────────────────────

const STAR_LABELS: Record<number, string> = {
  1: 'Awful',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

interface StarSelectorProps {
  value: number;
  onChange: (rating: number) => void;
  hasError?: boolean;
}

function StarSelector({ value, onChange, hasError }: StarSelectorProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Course star rating"
        aria-required="true"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-label={`${s} star${s !== 1 ? 's' : ''} — ${STAR_LABELS[s]}`}
            aria-checked={value === s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(value === s ? 0 : s)}
            className={cn(
              'p-1 rounded-md transition-transform duration-100 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary',
              hasError && value === 0 && 'ring-1 ring-rose-400 rounded-md',
            )}
          >
            <Star
              className={cn(
                'w-8 h-8 transition-colors duration-100',
                s <= active
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-100 text-gray-300',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      {/* Label pill */}
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-pill text-xs font-semibold transition-all duration-150',
          active > 0
            ? 'bg-hamplard-lilac text-hamplard-mid border border-hamplard-primary/30'
            : 'bg-gray-50 text-gray-400 border border-gray-200',
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            active > 0 ? 'bg-hamplard-primary' : 'bg-gray-300',
          )}
        />
        {active > 0 ? `${active} — ${STAR_LABELS[active]}` : 'No rating yet'}
      </span>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export interface ReviewFormProps {
  courseName?: string;
  /** If present, renders as edit mode with pre-filled values */
  existingReview?: {
    rating: number;
    text: string;
    authorName: string;
    date: string;
  };
  onSubmit?: (rating: number, text: string) => Promise<void>;
  className?: string;
}

const MIN_CHARS = 50;
const MAX_CHARS = 500;

type FormState = 'empty' | 'filled' | 'submitted';

/**
 * ReviewForm
 *
 * Three interactive states:
 *
 * 1. Empty   — star selector at 0, empty textarea. Submit is disabled / shows
 *              inline validation when attempted.
 * 2. Filled  — star selected + text ≥ MIN_CHARS. Submit button is active.
 * 3. Submitted — success confirmation showing the submitted review preview,
 *               with an "Edit review" button to return to the form.
 *
 * Also handles edit mode when `existingReview` prop is provided (pre-filled).
 */
export function ReviewForm({
  courseName = 'This Course',
  existingReview,
  onSubmit,
  className,
}: ReviewFormProps) {
  const isEditMode = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [text, setText] = useState(existingReview?.text ?? '');
  const [errors, setErrors] = useState<{ rating?: string; text?: string }>({});
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>(isEditMode ? 'filled' : 'empty');

  const charCount = text.length;
  const charOver = charCount > MAX_CHARS;
  const charNearLimit = charCount >= MAX_CHARS * 0.85;

  // Derive current state
  const isFilled = rating > 0 && text.trim().length >= MIN_CHARS && !charOver;

  function handleRatingChange(r: number) {
    setRating(r);
    setErrors((prev) => ({ ...prev, rating: undefined }));
    updateFormState(r, text);
  }

  function handleTextChange(val: string) {
    setText(val);
    if (errors.text) setErrors((prev) => ({ ...prev, text: undefined }));
    updateFormState(rating, val);
  }

  function updateFormState(r: number, t: string) {
    const filled = r > 0 && t.trim().length >= MIN_CHARS && t.length <= MAX_CHARS;
    setFormState(filled ? 'filled' : 'empty');
  }

  function validate(): boolean {
    const errs: { rating?: string; text?: string } = {};
    if (rating === 0) errs.rating = 'Please select a star rating.';
    if (text.trim().length < MIN_CHARS)
      errs.text = `Write at least ${MIN_CHARS} characters (${MIN_CHARS - text.trim().length} more needed).`;
    if (charOver) errs.text = `Shorten your review to ${MAX_CHARS} characters or fewer.`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit?.(rating, text);
      setFormState('submitted');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setFormState(isFilled ? 'filled' : 'empty');
    setErrors({});
  }

  // ── Submitted state ────────────────────────────────────────────────────────
  if (formState === 'submitted') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-hamplard-primary/30 bg-white overflow-hidden',
          className,
        )}
      >
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-hamplard-primary via-hamplard-primary/70 to-hamplard-lilac" />

        <div className="p-6">
          {/* Success icon + message */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-hamplard-primary flex items-center justify-center shadow-md mb-4">
              <CheckCircle className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-hamplard-deep">
              {isEditMode ? 'Review updated!' : 'Thank you for your review!'}
            </h2>
            <p className="mt-1 text-sm text-semantic-text-muted">
              Your feedback helps others decide if{' '}
              <strong className="text-hamplard-deep">{courseName}</strong> is right for them.
            </p>
          </div>

          {/* Review preview card */}
          <div className="rounded-xl bg-hamplard-lilac/40 border border-hamplard-primary/20 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-hamplard-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(existingReview?.authorName ?? 'Y')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-hamplard-deep">
                  {existingReview?.authorName ?? 'You'}
                </p>
                <p className="text-[10px] text-semantic-text-muted">Just now</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5" aria-label={`${rating} stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'w-3.5 h-3.5',
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-hamplard-deep/80 leading-relaxed">{text}</p>
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={handleEdit}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-semantic-border text-sm font-medium text-hamplard-primary',
              'hover:bg-hamplard-lilac hover:border-hamplard-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary',
            )}
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit review
          </button>
        </div>
      </div>
    );
  }

  // ── Empty / Filled form state ──────────────────────────────────────────────
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white overflow-hidden transition-shadow duration-200',
        isFilled
          ? 'border-hamplard-primary/40 shadow-md'
          : 'border-semantic-border',
        className,
      )}
    >
      {/* Accent bar */}
      <div
        className={cn(
          'h-1 transition-all duration-300',
          isFilled
            ? 'bg-gradient-to-r from-hamplard-primary via-hamplard-primary/70 to-hamplard-lilac'
            : 'bg-gray-100',
        )}
      />

      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[11px] font-bold tracking-widest uppercase text-hamplard-primary mb-1">
            {isEditMode ? 'Edit your review' : 'Rate this course'}
          </p>
          <h2 className="text-lg font-semibold text-hamplard-deep leading-snug">
            {courseName}
          </h2>
        </div>

        <div className="h-px bg-semantic-border mb-5" />

        {/* Star selector */}
        <div className={cn('mb-5', errors.rating && 'mb-2')}>
          <StarSelector
            value={rating}
            onChange={handleRatingChange}
            hasError={!!errors.rating}
          />
          {errors.rating && (
            <p role="alert" className="mt-2 text-center text-xs text-rose-500">
              {errors.rating}
            </p>
          )}
        </div>

        {/* Textarea */}
        <div className="mb-5">
          <label
            htmlFor="review-text"
            className="block text-sm font-semibold text-hamplard-deep mb-1.5"
          >
            Share your experience
          </label>

          <div className="relative">
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="What did you learn? What would you tell a friend considering this course?"
              rows={5}
              aria-describedby={errors.text ? 'review-text-error' : 'review-text-hint'}
              aria-invalid={!!errors.text}
              className={cn(
                'w-full resize-y rounded-xl border px-4 py-3 pb-8 text-sm text-hamplard-deep leading-relaxed bg-white placeholder:text-gray-300 transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:border-hamplard-primary',
                errors.text || charOver
                  ? 'border-rose-400'
                  : isFilled
                  ? 'border-hamplard-primary/50'
                  : 'border-semantic-border',
              )}
            />
            {/* Character counter */}
            <span
              className={cn(
                'absolute bottom-3 right-3 text-[11px] font-semibold pointer-events-none tabular-nums',
                charOver ? 'text-rose-500' : charNearLimit ? 'text-amber-500' : 'text-gray-300',
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {/* Hint / error */}
          {errors.text ? (
            <p id="review-text-error" role="alert" className="mt-1.5 text-xs text-rose-500">
              {errors.text}
            </p>
          ) : charCount > 0 && charCount < MIN_CHARS ? (
            <p id="review-text-hint" className="mt-1.5 text-xs text-semantic-text-muted">
              {MIN_CHARS - charCount} more character{MIN_CHARS - charCount !== 1 ? 's' : ''} needed
            </p>
          ) : (
            <p id="review-text-hint" className="sr-only">
              Minimum {MIN_CHARS} characters required
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-hamplard-primary',
            isFilled && !loading
              ? 'bg-hamplard-primary text-white hover:bg-hamplard-mid active:bg-hamplard-deep shadow-md hover:shadow-lg hover:-translate-y-px'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
          aria-disabled={!isFilled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>{isEditMode ? 'Update review' : 'Submit review'}</>
          )}
        </button>

        {/* Edit mode — last reviewed date */}
        {isEditMode && existingReview?.date && (
          <p className="mt-3 text-center text-xs text-semantic-text-muted">
            Last reviewed {existingReview.date}
          </p>
        )}
      </div>
    </div>
  );
}

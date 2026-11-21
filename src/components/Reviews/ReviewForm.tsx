'use client';

import { useRef, useState } from 'react';
import { Star, CheckCircle, Loader2, Pencil, ImagePlus, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Attachment config ─────────────────────────────────────────────────────────

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

interface Attachment {
  id: string;
  file: File;
  kind: 'image' | 'video';
  previewUrl: string;
  progress: number;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

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

// ── Attachment previews ───────────────────────────────────────────────────────

interface AttachmentPreviewsProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

function AttachmentPreviews({ attachments, onRemove }: AttachmentPreviewsProps) {
  if (attachments.length === 0) return null;

  return (
    <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3" aria-label="Review attachments">
      {attachments.map((att) => (
        <li
          key={att.id}
          className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
        >
          {att.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={att.previewUrl}
              alt={att.file.name}
              className="w-full h-20 object-cover"
            />
          ) : (
            <video
              src={att.previewUrl}
              className="w-full h-20 object-cover"
              muted
              playsInline
              aria-label={att.file.name}
            />
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            aria-label={`Remove ${att.file.name}`}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-opacity"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>

          {/* Per-file upload progress */}
          {att.progress < 100 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
              <div
                className="h-full bg-hamplard-primary transition-all duration-150"
                style={{ width: `${att.progress}%` }}
                role="progressbar"
                aria-valuenow={att.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Uploading ${att.file.name}`}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
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

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // ── Attachment handling ────────────────────────────────────────────────────

  function simulateProgress(id: string) {
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 20);
      setAttachments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, progress } : a)),
      );
      if (progress >= 100) clearInterval(timer);
    }, 120);
  }

  function addFiles(files: FileList | null, kind: 'image' | 'video') {
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    const incoming = Array.from(files);
    const accepted: Attachment[] = [];
    const rejected: string[] = [];

    const currentImages = attachments.filter((a) => a.kind === 'image').length;
    const hasVideo = attachments.some((a) => a.kind === 'video');
    let imageSlots = MAX_IMAGES - currentImages;
    let videoSlot = !hasVideo;

    for (const file of incoming) {
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (kind === 'image') {
        if (!isImage) {
          rejected.push(`${file.name}: only JPG, PNG, WEBP or GIF images are allowed.`);
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          rejected.push(`${file.name}: images must be ${formatBytes(MAX_IMAGE_BYTES)} or smaller.`);
          continue;
        }
        if (imageSlots <= 0) {
          rejected.push(`${file.name}: you can attach up to ${MAX_IMAGES} images.`);
          continue;
        }
        imageSlots -= 1;
      } else {
        if (!isVideo) {
          rejected.push(`${file.name}: only MP4, WEBM or MOV videos are allowed.`);
          continue;
        }
        if (file.size > MAX_VIDEO_BYTES) {
          rejected.push(`${file.name}: videos must be ${formatBytes(MAX_VIDEO_BYTES)} or smaller.`);
          continue;
        }
        if (!videoSlot) {
          rejected.push(`${file.name}: only one video can be attached.`);
          continue;
        }
        videoSlot = false;
      }

      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
      });
    }

    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
      accepted.forEach((a) => simulateProgress(a.id));
    }
    if (rejected.length > 0) setAttachmentError(rejected.join(' '));
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
    setAttachmentError(null);
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
            <p className="text-sm text-hamplard-deep whitespace-pre-wrap">{text}</p>
            {attachments.length > 0 && (
              <div className="mt-3">
                <AttachmentPreviews attachments={attachments} onRemove={() => {}} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleEdit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-hamplard-primary/40 px-4 py-2.5 text-sm font-semibold text-hamplard-mid hover:bg-hamplard-lilac/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit review
          </button>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white overflow-hidden',
        className,
      )}
    >
      <div className="h-1 bg-gradient-to-r from-hamplard-primary via-hamplard-primary/70 to-hamplard-lilac" />

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-hamplard-deep">
            {isEditMode ? 'Edit your review' : `Review ${courseName}`}
          </h2>
          <p className="mt-1 text-sm text-semantic-text-muted">
            Share your honest experience to help other students.
          </p>
        </div>

        {/* Rating */}
        <div className="flex flex-col items-center gap-2">
          <StarSelector
            value={rating}
            onChange={handleRatingChange}
            hasError={!!errors.rating}
          />
          {errors.rating && (
            <p className="text-xs text-rose-500" role="alert">
              {errors.rating}
            </p>
          )}
        </div>

        {/* Text */}
        <div>
          <label
            htmlFor="review-text"
            className="block text-sm font-medium text-hamplard-deep mb-1.5"
          >
            Your review
          </label>
          <textarea
            id="review-text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={5}
            placeholder={`What stood out? What could be better? (min ${MIN_CHARS} characters)`}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm text-hamplard-deep placeholder:text-gray-400 resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary',
              errors.text ? 'border-rose-400' : 'border-gray-200',
            )}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.text ? (
              <p className="text-xs text-rose-500" role="alert">
                {errors.text}
              </p>
            ) : (
              <span />
            )}
            <span
              className={cn(
                'text-xs',
                charOver
                  ? 'text-rose-500 font-semibold'
                  : charNearLimit
                    ? 'text-amber-500'
                    : 'text-semantic-text-muted',
              )}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <p className="block text-sm font-medium text-hamplard-deep mb-1.5">
            Add photos or a video{' '}
            <span className="font-normal text-semantic-text-muted">(optional)</span>
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-hamplard-mid hover:bg-hamplard-lilac/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              Add images
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-hamplard-mid hover:bg-hamplard-lilac/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
            >
              <Video className="w-4 h-4" aria-hidden="true" />
              Add video
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files, 'image');
              e.target.value = '';
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files, 'video');
              e.target.value = '';
            }}
          />

          <p className="mt-1.5 text-[11px] text-semantic-text-muted">
            Up to {MAX_IMAGES} images ({formatBytes(MAX_IMAGE_BYTES)} each) and one video (
            {formatBytes(MAX_VIDEO_BYTES)}).
          </p>

          {attachmentError && (
            <p className="mt-2 text-xs text-rose-500" role="alert">
              {attachmentError}
            </p>
          )}

          {attachments.length > 0 && (
            <div className="mt-3">
              <AttachmentPreviews attachments={attachments} onRemove={removeAttachment} />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary',
            isFilled
              ? 'bg-hamplard-primary hover:bg-hamplard-mid'
              : 'bg-hamplard-primary/50 cursor-not-allowed',
          )}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {isEditMode ? 'Update review' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}

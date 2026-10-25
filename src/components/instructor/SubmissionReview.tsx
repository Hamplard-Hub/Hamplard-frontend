'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Check, X, XCircle } from 'lucide-react';
import { assignmentsApi } from '@/lib/api/services';
import type { AssignmentStatus } from '@/types';

export interface ReviewSubmission {
  id: string;
  studentName: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  submittedAt: string;
  status: AssignmentStatus;
  submissionUrls: string[];
  notes: string;
  rubric: unknown;
  feedback: string;
}

interface SubmissionReviewProps {
  submission: ReviewSubmission;
  onReviewed: (id: string, status: AssignmentStatus, feedback: string) => void;
}

interface RubricCriterion {
  id: string;
  label: string;
  maxScore: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getRubricCriteria(rubric: unknown): RubricCriterion[] {
  const rubricRecord = asRecord(rubric);
  const source = rubricRecord?.criteria ?? rubricRecord?.items ?? rubric;
  const items = Array.isArray(source) ? source : typeof source === 'string' ? [source] : [];

  return items.flatMap((item, index) => {
    if (typeof item === 'string') {
      return [{ id: `${index}`, label: item, maxScore: 5 }];
    }
    const criterion = asRecord(item);
    if (!criterion) return [];
    const label = [criterion.title, criterion.name, criterion.criterion, criterion.description]
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (!label) return [];
    const points = typeof criterion.points === 'number' && criterion.points > 0
      ? Math.min(100, Math.floor(criterion.points))
      : 5;
    return [{ id: `${index}`, label, maxScore: points }];
  });
}

function parseImageUrls(value: string[]): string[] {
  return value.flatMap((item) => {
    try {
      const parsed: unknown = JSON.parse(item);
      if (Array.isArray(parsed)) return parsed.filter((url): url is string => typeof url === 'string');
    } catch {
      // A regular URL is the common single-image submission format.
    }
    return item ? [item] : [];
  });
}

export function SubmissionReview({ submission, onReviewed }: SubmissionReviewProps) {
  const criteria = getRubricCriteria(submission.rubric);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState(submission.feedback);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setScores({});
    setFeedback(submission.feedback);
    setError('');
  }, [submission.id, submission.feedback]);

  const images = parseImageUrls(submission.submissionUrls);
  const hasUnscoredCriteria = criteria.some((criterion) => scores[criterion.id] === undefined);

  const review = async (approved: boolean) => {
    if (saving) return;
    if (criteria.length > 0 && hasUnscoredCriteria) {
      setError('Score each rubric criterion before submitting your review.');
      return;
    }
    if (!approved && !feedback.trim()) {
      setError('Add feedback explaining what the student should revise.');
      return;
    }

    const rubricFeedback = criteria.length
      ? `Rubric scores:\n${criteria.map((criterion) => `- ${criterion.label}: ${scores[criterion.id]}/${criterion.maxScore}`).join('\n')}`
      : '';
    const savedFeedback = [rubricFeedback, feedback.trim()].filter(Boolean).join('\n\n');

    setSaving(true);
    setError('');
    try {
      await assignmentsApi.review(submission.id, approved, savedFeedback);
      onReviewed(submission.id, approved ? 'APPROVED' : 'REJECTED', savedFeedback);
    } catch {
      setError('Your review could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="review-heading">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Review submission</p>
          <h2 id="review-heading" className="mt-1 font-display text-lg font-semibold text-ink-900">{submission.studentName}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{submission.courseTitle} <span aria-hidden="true">/</span> {submission.lessonTitle}</p>
        </div>
        <StatusLabel status={submission.status} />
      </div>

      {images.length > 0 ? (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-ink-800">Student work</h3>
          <div className="flex flex-wrap gap-2">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="overflow-hidden rounded-lg border border-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hamplard-primary"
                aria-label={`View submission image ${index + 1} larger`}
              >
                <Image src={url} alt={`Student submission ${index + 1}`} width={128} height={96} unoptimized className="h-24 w-32 object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-lg bg-ink-50 px-3 py-4 text-sm text-ink-500">No submission image was attached.</div>
      )}

      {submission.notes && (
        <div className="mb-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-800">Student note</h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink-600">{submission.notes}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-800">Rubric scoring</h3>
          {criteria.length ? (
            <div className="divide-y divide-ink-100 rounded-lg border border-ink-100">
              {criteria.map((criterion) => (
                <label key={criterion.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 text-ink-700">{criterion.label}</span>
                  <span className="flex items-center gap-2 text-xs text-ink-500">
                    <select
                      aria-label={`Score ${criterion.label}`}
                      value={scores[criterion.id] ?? ''}
                      onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: event.target.value }))}
                      className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-800"
                    >
                      <option value="">Score</option>
                      {Array.from({ length: criterion.maxScore + 1 }, (_, score) => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                    <span>/ {criterion.maxScore}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">No rubric criteria were provided for this assignment.</p>
          )}
        </div>

        <label className="block text-sm font-semibold text-ink-800" htmlFor="submission-feedback">
          Feedback
          <textarea
            id="submission-feedback"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={4}
            placeholder="Share specific, constructive feedback..."
            className="mt-2 block w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm font-normal text-ink-800 placeholder:text-ink-400 focus:border-hamplard-primary focus:outline-none focus:ring-2 focus:ring-hamplard-primary/20"
          />
        </label>

        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

        {submission.status !== 'APPROVED' && submission.status !== 'REJECTED' ? (
          <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            <button type="button" onClick={() => review(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Check className="h-4 w-4" /> Approve
            </button>
            <button type="button" onClick={() => review(false)} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Request revision
            </button>
          </div>
        ) : (
          <p className="border-t border-ink-100 pt-4 text-sm font-medium text-ink-600">
            {submission.status === 'APPROVED' ? 'This submission has been approved.' : 'Revision was requested.'}
          </p>
        )}
      </div>

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Submission image">
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close image">
            <X className="h-5 w-5" />
          </button>
          <Image src={lightboxUrl} alt="Student submission enlarged" width={1600} height={1200} unoptimized className="max-h-[90vh] max-w-[95vw] object-contain" />
        </div>
      )}
    </section>
  );
}

function StatusLabel({ status }: { status: AssignmentStatus }) {
  const styles: Record<AssignmentStatus, string> = {
    PENDING: 'bg-ink-100 text-ink-600',
    SUBMITTED: 'bg-blue-50 text-blue-700',
    APPROVED: 'bg-leaf-50 text-leaf-700',
    REJECTED: 'bg-rose-50 text-rose-700',
  };
  const labels: Record<AssignmentStatus, string> = {
    PENDING: 'Pending',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    REJECTED: 'Revision requested',
  };

  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>{labels[status]}</span>;
}
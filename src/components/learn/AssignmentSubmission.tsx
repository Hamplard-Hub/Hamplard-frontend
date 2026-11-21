'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Send } from 'lucide-react';
import { assignmentsApi } from '@/lib/api/services';
import { FileUpload, type UploadedFileResult } from '@/components/ui/FileUpload';
import type { AssignmentSubmission as AssignmentSubmissionRecord, Lesson } from '@/types';

type AssignmentDetails = {
  id: string;
  brief: string;
  rubric: unknown;
  submission: AssignmentSubmissionRecord | null;
};

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function textValue(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? '';
}

function findSubmission(value: unknown): AssignmentSubmissionRecord | null {
  const record = asRecord(value);
  if (!record) return null;

  const direct = asRecord(record.submission);
  if (direct) return direct as unknown as AssignmentSubmissionRecord;

  const submissions = Array.isArray(record.submissions) ? record.submissions : [];
  const latest = submissions
    .map(asRecord)
    .filter((item): item is RecordValue => item !== null)
    .sort((a, b) =>
      String(b.submittedAt ?? '').localeCompare(String(a.submittedAt ?? '')),
    )[0];
  return (latest as unknown as AssignmentSubmissionRecord | undefined) ?? null;
}

function normalizeAssignment(value: unknown, lesson: Lesson): AssignmentDetails | null {
  const root = asRecord(value);
  if (!root) return null;
  const nested = asRecord(root.assignment);
  const assignment = nested ?? root;
  const id = textValue(assignment.id, assignment.assignmentId);
  if (!id) return null;

  return {
    id,
    brief: textValue(assignment.brief, assignment.instructions, assignment.description, assignment.content, lesson.content, lesson.description),
    rubric: assignment.rubric ?? assignment.criteria ?? null,
    submission: findSubmission(root) ?? findSubmission(assignment),
  };
}

function statusLabel(status?: string | null, hasSubmission = false): string {
  switch (status) {
    case 'PENDING':
    case 'SUBMITTED':
      return 'Submitted';
    case 'APPROVED':
      return 'Reviewed';
    case 'REJECTED':
      return 'Needs revision';
    default:
      return hasSubmission ? 'Submitted' : 'Not submitted';
  }
}

function renderRubric(rubric: unknown) {
  if (typeof rubric === 'string') {
    return <p className="whitespace-pre-wrap text-sm text-ink-600">{rubric}</p>;
  }
  const rubricRecord = asRecord(rubric);
  if (rubricRecord) {
    const criteria = rubricRecord.criteria ?? rubricRecord.items;
    if (criteria) return renderRubric(criteria);
    const description = textValue(rubricRecord.description, rubricRecord.instructions);
    if (description) return <p className="whitespace-pre-wrap text-sm text-ink-600">{description}</p>;
  }
  if (!Array.isArray(rubric) || rubric.length === 0) return null;

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-ink-600">
      {rubric.map((item, index) => {
        if (typeof item === 'string') return <li key={index}>{item}</li>;
        const criterion = asRecord(item);
        if (!criterion) return null;
        const label = textValue(criterion.title, criterion.name, criterion.criterion, criterion.description);
        const points = typeof criterion.points === 'number' ? ` (${criterion.points} points)` : '';
        return label ? <li key={index}>{label}{points}</li> : null;
      })}
    </ul>
  );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const ASSIGNMENT_UPLOAD_URL = `${API_BASE_URL.replace(/\/+$/, '')}/uploads/assignment`;

export function AssignmentSubmission({ lesson }: { lesson: Lesson }) {
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [note, setNote] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setAssignment(null);

    assignmentsApi.getByLesson(lesson.id)
      .then((response: unknown) => {
        if (!cancelled) {
          const details = normalizeAssignment(response, lesson);
          if (details) setAssignment(details);
          else setLoadError('Assignment details are unavailable right now.');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this assignment. Please try again later.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lesson]);

  const status = assignment?.submission?.status;
  const isRevision = status === 'REJECTED';
  const canSubmit = !assignment?.submission || isRevision;
  const isUploading = uploadCount > 0;
  const statusStyle = useMemo(() => {
    if (status === 'APPROVED') return 'bg-leaf-50 text-leaf-700';
    if (status === 'REJECTED') return 'bg-rose-50 text-rose-700';
    if (status === 'SUBMITTED') return 'bg-blue-50 text-blue-700';
    return 'bg-ink-50 text-ink-600';
  }, [status]);

  const handleUploadComplete = useCallback((file: UploadedFileResult) => {
    setUploadedUrls((current) => file.url && !current.includes(file.url) ? [...current, file.url] : current);
    setUploadCount((current) => Math.max(0, current - 1));
  }, []);

  const handleUploadStart = useCallback(() => {
    setUploadCount((current) => current + 1);
  }, []);

  const handleUploadFinish = useCallback(() => {
    setUploadCount((current) => Math.max(0, current - 1));
  }, []);

  const handleFileRemove = useCallback((url?: string) => {
    if (url) setUploadedUrls((current) => current.filter((uploadedUrl) => uploadedUrl !== url));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignment || !canSubmit || saving || uploadedUrls.length === 0 || isUploading) return;

    setSaving(true);
    setSubmitError('');
    try {
      // The API exposes a single submissionUrl field; encode all uploaded asset URLs there.
      const submissionUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : JSON.stringify(uploadedUrls);
      const response = await assignmentsApi.submit(assignment.id, submissionUrl, note.trim() || undefined);
      const submittedRecord = asRecord(response);
      const newSubmission = (asRecord(submittedRecord?.submission) ?? submittedRecord) as unknown as AssignmentSubmissionRecord | null;
      setAssignment((current) => current ? {
        ...current,
        submission: newSubmission?.id
          ? newSubmission
          : {
              id: '',
              assignmentId: current.id,
              studentId: '',
              submissionUrl,
              notes: note.trim() || null,
              status: 'SUBMITTED',
              feedback: null,
              submittedAt: new Date().toISOString(),
              reviewedAt: null,
            },
      } : current);
      setNote('');
      setUploadedUrls([]);
      setUploadCount(0);
      setUploaderKey((key) => key + 1);
    } catch {
      setSubmitError('Your work could not be submitted. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card flex items-center gap-2 p-5 text-sm text-ink-500"><Loader2 className="h-4 w-4 animate-spin" />Loading assignment…</div>;
  }

  if (loadError || !assignment) {
    return <div className="card flex items-start gap-2 p-5 text-sm text-rose-700" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loadError || 'Assignment details are unavailable right now.'}</div>;
  }

  return (
    <section className="card mb-5 space-y-5 p-5 sm:p-6" aria-labelledby="assignment-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-saffron-700">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide">Practice assignment</span>
          </div>
          <h2 id="assignment-heading" className="text-lg font-semibold text-ink-900">{lesson.title}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`} role="status">
          {statusLabel(status, Boolean(assignment.submission))}
        </span>
      </div>

      {assignment.brief && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-ink-800">Assignment brief</h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink-600">{assignment.brief}</p>
        </div>
      )}

      {assignment.rubric != null && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-ink-800">Review rubric</h3>
          {renderRubric(assignment.rubric) ?? <p className="text-sm text-ink-500">Rubric details will be provided by your instructor.</p>}
        </div>
      )}

      {assignment.submission?.feedback && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
          <h3 className="text-sm font-semibold text-rose-800">Instructor feedback</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-rose-700">{assignment.submission.feedback}</p>
        </div>
      )}

      {canSubmit ? (
        <form className="space-y-4 border-t border-ink-100 pt-5" onSubmit={handleSubmit}>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-ink-800">{isRevision ? 'Resubmit your work' : 'Submit your work'}</h3>
            <p className="text-xs text-ink-500">Upload up to 5 photos and 1 video to document your work.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FileUpload
              key={`photos-${uploaderKey}`}
              uploadUrl={ASSIGNMENT_UPLOAD_URL}
              accept={['image/*']}
              maxFiles={5}
              label="Upload photos"
              hint="JPG, PNG, WEBP or other image files · up to 5 photos"
              onUploadComplete={handleUploadComplete}
              onUploadStart={handleUploadStart}
              onUploadFinish={handleUploadFinish}
              onFileRemove={handleFileRemove}
              className="rounded-xl bg-white"
            />
            <FileUpload
              key={`video-${uploaderKey}`}
              uploadUrl={ASSIGNMENT_UPLOAD_URL}
              accept={['video/*']}
              multiple={false}
              maxFiles={1}
              label="Upload one video (optional)"
              hint="Choose one video file"
              onUploadComplete={handleUploadComplete}
              onUploadStart={handleUploadStart}
              onUploadFinish={handleUploadFinish}
              onFileRemove={handleFileRemove}
              className="rounded-xl bg-white"
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Note for your instructor <span className="font-normal text-ink-400">(optional)</span></span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              maxLength={2000}
              className="input w-full resize-y"
              placeholder="Share context about your process or anything you'd like your instructor to know…"
            />
          </label>
          {submitError && <p role="alert" className="flex items-center gap-2 text-sm text-rose-600"><AlertCircle className="h-4 w-4" />{submitError}</p>}
          <button type="submit" disabled={saving || isUploading || uploadedUrls.length === 0} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? 'Submitting…' : isRevision ? 'Resubmit assignment' : 'Submit assignment'}
          </button>
          {uploadedUrls.length === 0 && <p className="text-xs text-ink-400">Upload at least one photo or video before submitting.</p>}
        </form>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-leaf-50 p-4 text-sm text-leaf-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {status === 'APPROVED' ? 'Your instructor has reviewed this assignment.' : 'Your work has been submitted and is awaiting instructor review.'}
        </div>
      )}
    </section>
  );
}

export default AssignmentSubmission;

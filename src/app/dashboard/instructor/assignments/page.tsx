'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, LoaderCircle } from 'lucide-react';
import { assignmentsApi } from '@/lib/api/services';
import type { AssignmentStatus } from '@/types';
import { SubmissionReview, type ReviewSubmission } from '@/components/instructor/SubmissionReview';

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as RecordValue
    : null;
}

function firstText(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? '';
}

function normalizeStatus(value: unknown): AssignmentStatus {
  return value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED' || value === 'SUBMITTED'
    ? value
    : 'SUBMITTED';
}

function submissionRows(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const root = asRecord(response);
  for (const candidate of [root?.data, root?.items, root?.submissions, root?.results]) {
    if (Array.isArray(candidate)) return candidate;
    const nested = asRecord(candidate);
    if (Array.isArray(nested?.data)) return nested.data;
  }
  return [];
}

function normalizeSubmission(value: unknown): ReviewSubmission | null {
  const root = asRecord(value);
  if (!root) return null;
  const submission = asRecord(root.submission) ?? root;
  const assignment = asRecord(root.assignment) ?? asRecord(submission.assignment) ?? {};
  const lesson = asRecord(root.lesson) ?? asRecord(assignment.lesson) ?? {};
  const courseModule = asRecord(lesson.module) ?? {};
  const course = asRecord(root.course) ?? asRecord(assignment.course) ?? asRecord(lesson.course) ?? asRecord(courseModule.course) ?? {};
  const student = asRecord(root.student) ?? asRecord(submission.student) ?? {};
  const id = firstText(submission.id, root.submissionId, root.id);
  if (!id) return null;

  const rawUrl = firstText(submission.submissionUrl, submission.fileUrl, submission.imageUrl);
  let submissionUrls = rawUrl ? [rawUrl] : [];
  if (rawUrl) {
    try {
      const parsed: unknown = JSON.parse(rawUrl);
      if (Array.isArray(parsed)) submissionUrls = parsed.filter((url): url is string => typeof url === 'string');
    } catch {
      // Keep a single URL when the backend returns a plain string.
    }
  }

  return {
    id,
    studentName: firstText(student.name, student.fullName, root.studentName, student.email, submission.studentId) || 'Student',
    studentId: firstText(student.id, submission.studentId),
    courseId: firstText(course.id, assignment.courseId, courseModule.courseId) || firstText(course.title, 'uncategorized'),
    courseTitle: firstText(course.title, root.courseTitle, 'Course'),
    lessonTitle: firstText(lesson.title, root.lessonTitle, assignment.title, 'Lesson'),
    submittedAt: firstText(submission.submittedAt, submission.createdAt, root.submittedAt),
    status: normalizeStatus(submission.status ?? root.status),
    submissionUrls,
    notes: firstText(submission.notes, submission.note),
    rubric: assignment.rubric ?? assignment.criteria ?? root.rubric ?? null,
    feedback: firstText(submission.feedback, root.feedback),
  };
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Revision requested' },
];

export default function InstructorAssignmentsPage() {
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    assignmentsApi.getPending()
      .then((response: unknown) => {
        if (cancelled) return;
        const normalized = submissionRows(response)
          .map(normalizeSubmission)
          .filter((item): item is ReviewSubmission => item !== null);
        normalized.sort((left, right) => {
          const leftTime = Date.parse(left.submittedAt) || 0;
          const rightTime = Date.parse(right.submittedAt) || 0;
          return leftTime - rightTime;
        });
        setSubmissions(normalized);
        setSelectedId(normalized[0]?.id ?? '');
      })
      .catch(() => {
        if (!cancelled) setError('Submissions could not be loaded. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const courses = useMemo(() => {
    const uniqueCourses = new Map<string, string>();
    submissions.forEach((submission) => uniqueCourses.set(submission.courseId, submission.courseTitle));
    return Array.from(uniqueCourses, ([id, title]) => ({ id, title }));
  }, [submissions]);

  const visibleSubmissions = useMemo(
    () => submissions
      .filter((submission) => courseFilter === 'all' || submission.courseId === courseFilter)
      .filter((submission) => statusFilter === 'all' || submission.status === statusFilter)
      .sort((left, right) => (Date.parse(left.submittedAt) || 0) - (Date.parse(right.submittedAt) || 0)),
    [submissions, courseFilter, statusFilter],
  );

  const selected = visibleSubmissions.find((submission) => submission.id === selectedId) ?? visibleSubmissions[0];

  const handleReviewed = (id: string, status: AssignmentStatus, feedback: string) => {
    setSubmissions((current) => current.map((submission) =>
      submission.id === id ? { ...submission, status, feedback } : submission,
    ));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-hamplard-primary">
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Instructor workspace</span>
          </div>
          <h1 className="section-heading">Assignment review</h1>
          <p className="mt-1 text-sm text-ink-500">Review student practice work and send actionable feedback.</p>
        </div>
        <p className="text-sm text-ink-500"><span className="font-semibold text-ink-800">{visibleSubmissions.length}</span> submissions</p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap gap-3 border-y border-ink-100 py-3">
        <label className="text-xs font-medium text-ink-500">
          Course
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="ml-2 min-w-44 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800">
            <option value="all">All courses</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-ink-500">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-2 min-w-44 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800">
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <span className="ml-auto self-center text-xs text-ink-400">Oldest submissions first</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading submissions...</div>
      ) : visibleSubmissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 px-5 py-12 text-center">
          <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-ink-300" />
          <p className="font-medium text-ink-800">No submissions match these filters</p>
          <p className="mt-1 text-sm text-ink-500">Try another course or status.</p>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
          <section aria-label="Submissions" className="overflow-hidden rounded-xl border border-ink-100 bg-white">
            <ul className="divide-y divide-ink-100">
              {visibleSubmissions.map((submission) => (
                <li key={submission.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(submission.id)}
                    aria-current={selected?.id === submission.id ? 'true' : undefined}
                    className={`w-full px-4 py-3 text-left transition hover:bg-ink-50 ${selected?.id === submission.id ? 'border-l-2 border-hamplard-primary bg-hamplard-lilac/20' : ''}`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{submission.studentName}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-500">{submission.courseTitle}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-400">{submission.lessonTitle}</span>
                      </span>
                      <StatusLabel status={submission.status} />
                    </span>
                    <time dateTime={submission.submittedAt} className="mt-2 block text-[11px] text-ink-400">
                      Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'date unavailable'}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {selected && <SubmissionReview key={selected.id} submission={selected} onReviewed={handleReviewed} />}
        </div>
      )}
    </div>
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
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${styles[status]}`}>{labels[status]}</span>;
}
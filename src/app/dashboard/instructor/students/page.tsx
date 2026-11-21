'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Users, TrendingUp, Star } from 'lucide-react';
import { instructorAnalyticsApi } from '@/lib/api/services';
import { StudentTable } from '@/components/instructor/StudentTable';
import type { StudentEnrollmentRow, StudentDetail } from '@/types';

/* ── CSV export helper ───────────────────────────────────────────────────── */
function exportCsv(rows: StudentEnrollmentRow[]) {
  const headers = [
    'Student Name',
    'Email',
    'Course',
    'Enrolled Date',
    'Progress (%)',
    'Last Active',
  ];

  const escape = (v: string | number | null | undefined) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((r) =>
      [
        r.studentName,
        r.studentEmail,
        r.courseTitle,
        r.enrolledAt ? new Date(r.enrolledAt).toLocaleDateString() : '',
        r.progressPercent,
        r.lastActiveAt ? new Date(r.lastActiveAt).toLocaleDateString() : '',
      ]
        .map(escape)
        .join(','),
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── page ────────────────────────────────────────────────────────────────── */
export default function InstructorStudentsPage() {
  const [allRows, setAllRows] = useState<StudentEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* fetch all students once */
  useEffect(() => {
    instructorAnalyticsApi
      .getStudents({ limit: 500 })
      .then((res) => setAllRows(res.data ?? []))
      .catch((e) => setError(e?.message ?? 'Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  /* filtered rows */
  const filteredRows = useMemo(
    () =>
      selectedCourseId
        ? allRows.filter((r) => r.courseId === selectedCourseId)
        : allRows,
    [allRows, selectedCourseId],
  );

  /* unique course options */
  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    allRows.forEach((r) => seen.set(r.courseId, r.courseTitle));
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [allRows]);

  /* aggregate stats */
  const totalStudents = useMemo(
    () => new Set(allRows.map((r) => r.studentId)).size,
    [allRows],
  );

  const avgCompletion = useMemo(() => {
    if (!allRows.length) return 0;
    return Math.round(
      allRows.reduce((sum, r) => sum + r.progressPercent, 0) / allRows.length,
    );
  }, [allRows]);

  /* open detail drawer */
  const handleRowClick = useCallback(
    async (studentId: string) => {
      if (detail?.studentId === studentId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      setDetail(null);
      try {
        const d = await instructorAnalyticsApi.getStudentDetail(studentId);
        setDetail(d);
      } catch {
        /* silently ignore — drawer just won't open */
      } finally {
        setDetailLoading(false);
      }
    },
    [detail],
  );

  /* ── render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-2.5 w-2.5 rounded-full bg-hamplard-primary animate-pulse" />
        <span className="ml-3 text-sm text-ink-500">Loading students…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-heading">Student Analytics</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Enrollment and progress across all your courses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportCsv(filteredRows)}
          disabled={filteredRows.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* ── aggregate cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total students"
          value={totalStudents}
          color="text-hamplard-primary"
          bg="bg-hamplard-lilac/40"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg completion"
          value={`${avgCompletion}%`}
          color="text-leaf-600"
          bg="bg-leaf-50"
        />
        <StatCard
          icon={Star}
          label="Avg rating received"
          value="—"
          color="text-saffron-600"
          bg="bg-saffron-50"
          note="Ratings coming soon"
        />
      </div>

      {/* ── error banner ── */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── table + detail drawer ── */}
      <StudentTable
        rows={filteredRows}
        courseOptions={courseOptions}
        selectedCourseId={selectedCourseId}
        onCourseFilter={setSelectedCourseId}
        onRowClick={handleRowClick}
        detail={detail}
        detailLoading={detailLoading}
        onCloseDetail={() => setDetail(null)}
      />
    </div>
  );
}

/* ── tiny stat card ─────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  note,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
      {note && <p className="mt-1 text-[10px] text-ink-300">{note}</p>}
    </div>
  );
}

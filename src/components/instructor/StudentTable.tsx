'use client';

import { useState } from 'react';
import { ChevronRight, X, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { StudentEnrollmentRow, StudentDetail } from '@/types';

interface StudentTableProps {
  rows: StudentEnrollmentRow[];
  /** All unique courses for the filter dropdown */
  courseOptions: { id: string; title: string }[];
  selectedCourseId: string;
  onCourseFilter: (courseId: string) => void;
  /** Called when a row is clicked — parent loads & passes the detail */
  onRowClick: (studentId: string) => void;
  /** If set, renders the detail drawer alongside the table */
  detail: StudentDetail | null;
  detailLoading: boolean;
  onCloseDetail: () => void;
}

export function StudentTable({
  rows,
  courseOptions,
  selectedCourseId,
  onCourseFilter,
  onRowClick,
  detail,
  detailLoading,
  onCloseDetail,
}: StudentTableProps) {
  return (
    <div className="flex gap-5 items-start">

      {/* ── Main table ── */}
      <div className={cn('flex-1 min-w-0 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm')}>

        {/* Filter bar */}
        <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3">
          <label htmlFor="course-filter" className="text-xs font-medium text-ink-500 shrink-0">
            Filter by course
          </label>
          <select
            id="course-filter"
            value={selectedCourseId}
            onChange={(e) => onCourseFilter(e.target.value)}
            className="ml-auto rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-hamplard-primary focus:outline-none focus:ring-1 focus:ring-hamplard-primary"
          >
            <option value="">All courses</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold text-ink-500">
                <th className="px-5 py-3 w-8" aria-hidden="true" />
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3 hidden sm:table-cell">Course</th>
                <th className="px-5 py-3 hidden md:table-cell">Enrolled</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3 hidden lg:table-cell">Last active</th>
                <th className="px-5 py-3 w-8" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-ink-400">
                    No students found.
                  </td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr
                  key={`${row.studentId}-${row.courseId}`}
                  onClick={() => onRowClick(row.studentId)}
                  className={cn(
                    'cursor-pointer border-b border-ink-50 transition-colors hover:bg-hamplard-lilac/30',
                    i % 2 === 0 ? 'bg-white' : 'bg-ink-50/40',
                    detail?.studentId === row.studentId && 'bg-hamplard-lilac/50',
                  )}
                >
                  {/* Avatar */}
                  <td className="px-5 py-3">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-saffron-100 flex items-center justify-center shrink-0">
                      {row.studentAvatarUrl ? (
                        <img src={row.studentAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-saffron-700">
                          {row.studentName?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Name + email */}
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900 truncate max-w-[140px]">
                      {row.studentName ?? 'Unknown'}
                    </p>
                    {row.studentEmail && (
                      <p className="text-xs text-ink-400 truncate max-w-[140px]">
                        {row.studentEmail}
                      </p>
                    )}
                  </td>

                  {/* Course */}
                  <td className="px-5 py-3 hidden sm:table-cell text-ink-700 truncate max-w-[160px]">
                    {row.courseTitle}
                  </td>

                  {/* Enrolled date */}
                  <td className="px-5 py-3 hidden md:table-cell text-xs text-ink-500">
                    {formatDate(row.enrolledAt)}
                  </td>

                  {/* Progress */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="h-1.5 flex-1 rounded-full bg-ink-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            row.progressPercent >= 100
                              ? 'bg-leaf-500'
                              : row.progressPercent >= 50
                              ? 'bg-hamplard-primary'
                              : 'bg-saffron-400',
                          )}
                          style={{ width: `${row.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-ink-700 w-8 text-right">
                        {row.progressPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Last active */}
                  <td className="px-5 py-3 hidden lg:table-cell text-xs text-ink-400">
                    {row.lastActiveAt ? formatDate(row.lastActiveAt) : '—'}
                  </td>

                  {/* Chevron */}
                  <td className="px-3 py-3">
                    <ChevronRight className="h-4 w-4 text-ink-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail drawer ── */}
      {(detail || detailLoading) && (
        <aside className="w-80 shrink-0 rounded-2xl border border-ink-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-ink-900">Student detail</h3>
            <button
              type="button"
              onClick={onCloseDetail}
              aria-label="Close detail"
              className="rounded-lg p-1 text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="h-2.5 w-2.5 rounded-full bg-hamplard-primary animate-pulse" />
              <span className="ml-2 text-xs text-ink-400">Loading…</span>
            </div>
          ) : detail && (
            <div className="overflow-y-auto max-h-[70vh] divide-y divide-ink-50">
              {/* Student header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-saffron-100 flex items-center justify-center shrink-0">
                  {detail.studentAvatarUrl ? (
                    <img src={detail.studentAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-saffron-700">
                      {detail.studentName?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{detail.studentName ?? 'Unknown'}</p>
                  {detail.studentEmail && (
                    <p className="text-xs text-ink-400">{detail.studentEmail}</p>
                  )}
                </div>
              </div>

              {/* Lesson-by-lesson progress per enrollment */}
              {detail.enrollments.map((enr) => (
                <div key={enr.courseId} className="px-5 py-4">
                  <p className="mb-1 text-xs font-semibold text-ink-700 truncate">{enr.courseTitle}</p>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-hamplard-primary"
                        style={{ width: `${enr.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-ink-700">{enr.progressPercent}%</span>
                  </div>

                  <ul className="space-y-1.5">
                    {enr.lessonProgress.map((lp) => (
                      <li key={lp.lessonId} className="flex items-center gap-2">
                        {lp.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-leaf-500 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-ink-200 shrink-0" />
                        )}
                        <span className={cn(
                          'text-xs truncate',
                          lp.completed ? 'text-ink-700' : 'text-ink-400',
                        )}>
                          {lp.lessonTitle}
                        </span>
                        {lp.watchedSecs > 0 && !lp.completed && (
                          <span className="ml-auto text-[10px] text-ink-300 shrink-0">
                            {Math.round(lp.watchedSecs / 60)}m
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

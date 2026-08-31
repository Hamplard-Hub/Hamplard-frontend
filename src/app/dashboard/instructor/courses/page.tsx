'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, Eye, Plus, Trash2 } from 'lucide-react';
import { BulkActionBar, type BulkActionType } from '@/components/instructor/BulkActionBar';
import { useToastContext } from '@/components/ui/ToastProvider';
import { coursesApi, usersApi } from '@/lib/api/services';
import { cn, courseStatusBadge, formatUsdc } from '@/lib/utils';
import type { Course } from '@/types';

const pageTitle = 'Course management';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const toast = useToastContext();

  const loadCourses = async () => {
    try {
      const stats = await usersApi.getInstructorStats();
      setCourses(stats?.courses ?? []);

      const allCategories = await coursesApi.getCategories();
      setCategories(allCategories.map((category) => category.name));
    } catch (error) {
      console.error('Failed to load instructor courses', error);
      toast.error({
        title: 'Unable to load courses',
        description: 'Please refresh the page and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const allSelected = courses.length > 0 && selectedIds.length === courses.length;
  const selectedCourses = useMemo(
    () => courses.filter((course) => selectedIds.includes(course.id)),
    [courses, selectedIds],
  );

  const toggleCourse = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((courseId) => courseId !== id) : [...current, id],
    );
  };

  const selectAll = () => {
    setSelectedIds(allSelected ? [] : courses.map((course) => course.id));
  };

  const applyBulkAction = async (action: BulkActionType, category?: string) => {
    if (!selectedIds.length) return;

    if (action === 'delete') {
      setShowDeleteDialog(true);
      return;
    }

    await executeBulkAction(action, category);
  };

  const executeBulkAction = async (action: BulkActionType, category?: string) => {
    if (!selectedIds.length) return;

    const ids = [...selectedIds];
    setIsUpdating(true);

    try {
      let successCount = 0;

      for (const [index, id] of ids.entries()) {
        const course = courses.find((item) => item.id === id);

        if (action === 'publish') {
          await coursesApi.update(id, { status: 'ACTIVE' });
          setCourses((current) =>
            current.map((item) => (item.id === id ? { ...item, status: 'ACTIVE' } : item)),
          );
        }

        if (action === 'unpublish') {
          await coursesApi.update(id, { status: 'PAUSED' });
          setCourses((current) =>
            current.map((item) => (item.id === id ? { ...item, status: 'PAUSED' } : item)),
          );
        }

        if (action === 'category' && category) {
          await coursesApi.update(id, { category });
          setCourses((current) =>
            current.map((item) => (item.id === id ? { ...item, category } : item)),
          );
        }

        successCount += 1;
        toast.info({
          title: `${successCount} of ${ids.length} courses updated...`,
          description: course?.title ? `Updating “${course.title}”` : 'Processing course update',
          duration: 2500,
        });

        if (index < ids.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      toast.success({
        title: 'Bulk update complete',
        description: `${successCount} course${successCount === 1 ? '' : 's'} updated successfully.`,
      });
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk update failed', error);
      toast.error({
        title: 'Bulk update failed',
        description: 'Some changes could not be saved. Please try again.',
      });
    } finally {
      setIsUpdating(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIds.length) return;

    const ids = [...selectedIds];
    setIsUpdating(true);

    try {
      let deletedCount = 0;

      for (const [index, id] of ids.entries()) {
        const course = courses.find((item) => item.id === id);
        await coursesApi.remove(id);
        deletedCount += 1;

        toast.info({
          title: `${deletedCount} of ${ids.length} courses updated...`,
          description: course?.title ? `Deleting “${course.title}”` : 'Deleting course',
          duration: 2500,
        });

        if (index < ids.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      setCourses((current) => current.filter((course) => !ids.includes(course.id)));
      setSelectedIds([]);
      toast.success({
        title: 'Delete complete',
        description: `${deletedCount} course${deletedCount === 1 ? '' : 's'} removed.`,
      });
    } catch (error) {
      console.error('Bulk delete failed', error);
      toast.error({
        title: 'Delete failed',
        description: 'One or more courses could not be deleted. Please try again.',
      });
    } finally {
      setIsUpdating(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-52 animate-pulse rounded-xl bg-[#F1EEFF]" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#F1EEFF]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#F1EEFF]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="section-heading">{pageTitle}</h1>
          <p className="mt-1 text-sm text-[#4A467A]">
            {courses.length} course{courses.length === 1 ? '' : 's'} available
          </p>
        </div>

        <Link href="/dashboard/courses/create" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New course
        </Link>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        categories={categories}
        isBusy={isUpdating}
        onApply={applyBulkAction}
      />

      {courses.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-[#D0C9FF]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#26215C]">No courses yet</p>
          <p className="mt-1 text-xs text-[#5A5578]">Create your first course to start managing enrollments.</p>
          <Link href="/dashboard/courses/create" className="btn-primary mt-4 inline-flex">
            Create course
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E3FF] bg-white shadow-sm">
          <table className="min-w-full divide-y divide-[#EFEAFF] text-left text-sm">
            <thead className="bg-[#F7F4FF] text-[#26215C]">
              <tr>
                <th className="p-3 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all courses"
                    checked={allSelected}
                    onChange={selectAll}
                    className="h-4 w-4 rounded border-[#B3ADDF] text-[#4A42B8]"
                  />
                </th>
                <th className="p-3 font-semibold">Course</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Students</th>
                <th className="p-3 font-semibold">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEFF]">
              {courses.map((course) => {
                const checked = selectedIds.includes(course.id);

                return (
                  <tr key={course.id} className={cn('transition', checked && 'bg-[#F7F5FF]')}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select ${course.title}`}
                        checked={checked}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 rounded border-[#B3ADDF] text-[#4A42B8]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEEDFE] text-xs font-bold text-[#4A42B8]">
                          {course.title.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#26215C]">{course.title}</p>
                          <p className="text-xs text-[#5A5578]">{course.level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#4A467A]">{course.category}</td>
                    <td className="p-3 text-[#26215C]">{formatUsdc(course.price)}</td>
                    <td className="p-3">
                      <span className={courseStatusBadge(course.status)}>{course.status}</span>
                    </td>
                    <td className="p-3 text-[#4A467A]">{course.totalEnrollments}</td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#D3D0F2] px-2.5 py-1.5 text-xs font-medium text-[#26215C] hover:bg-[#F7F5FF]"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteDialog && selectedCourses.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17152B]/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-bulk-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="delete-bulk-title" className="text-lg font-semibold text-[#26215C]">
                  Delete selected courses?
                </h2>
                <p className="text-sm text-[#5A5578]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-[#F7F5FF] p-3 text-sm text-[#4A467A]">
              {selectedCourses.length} course{selectedCourses.length === 1 ? '' : 's'} will be permanently removed.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-xl border border-[#D3D0F2] px-4 py-2.5 text-sm font-medium text-[#26215C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete courses
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

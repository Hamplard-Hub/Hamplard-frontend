"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  BellRing,
  CalendarClock,
  Loader2,
  Pencil,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { announcementsApi, usersApi } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import type { Announcement, Course } from "@/types";

const announcementSchema = z.object({
  courseId: z.string().min(1, "Choose a course to announce to."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});
type AnnouncementFormValues = z.infer<typeof announcementSchema>;
type AnnouncementStatus = "draft" | "scheduled" | "published";

const statusStyles: Record<AnnouncementStatus, string> = {
  draft: "bg-ink-100 text-ink-600",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-saffron-100 text-saffron-700",
};
const statusLabel: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};
const getStatus = (announcement: Announcement): AnnouncementStatus =>
  announcement.status ?? "published";

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function InstructorAnnouncementsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [activeTab, setActiveTab] = useState<AnnouncementStatus>("published");
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { courseId: "", subject: "", message: "" },
  });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === watch("courseId")) ?? null,
    [courses, watch],
  );
  const visibleAnnouncements = useMemo(
    () => announcements.filter((item) => getStatus(item) === activeTab),
    [activeTab, announcements],
  );
  const tabCount = (status: AnnouncementStatus) =>
    announcements.filter((item) => getStatus(item) === status).length;

  useEffect(() => {
    const loadData = async () => {
      try {
        const stats = await usersApi.getInstructorStats();
        setCourses(stats?.courses ?? []);
        if (stats?.courses?.[0]?.id)
          reset((previous) => ({ ...previous, courseId: stats.courses[0].id }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCourses(false);
      }
      try {
        const response = await announcementsApi.list();
        setAnnouncements(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    loadData();
  }, [reset]);

  const clearComposer = (courseId = "") => {
    reset({ courseId, subject: "", message: "" });
    setScheduledFor("");
    setEditingId(null);
  };

  const saveAnnouncement = async (
    values: AnnouncementFormValues,
    status: AnnouncementStatus,
  ) => {
    const course = courses.find((item) => item.id === values.courseId);
    if (!course) return;
    if (status === "scheduled") {
      const scheduledDate = new Date(scheduledFor);
      if (
        !scheduledFor ||
        Number.isNaN(scheduledDate.getTime()) ||
        scheduledDate <= new Date()
      ) {
        setFeedback(
          "Choose a future date and time before scheduling this announcement.",
        );
        return;
      }
    }
    setSubmitting(true);
    setFeedback(null);
    const payload = {
      courseId: course.id,
      courseTitle: course.title,
      subject: values.subject,
      message: values.message,
      deliveryCount: Math.max(course.totalEnrollments, 1),
      status,
      scheduledFor:
        status === "scheduled" ? new Date(scheduledFor).toISOString() : null,
    } as const;
    try {
      if (editingId) {
        const updated = await announcementsApi.update(editingId, payload);
        setAnnouncements((previous) =>
          previous.map((item) =>
            item.id === editingId
              ? { ...updated, status, scheduledFor: payload.scheduledFor }
              : item,
          ),
        );
        setFeedback(`${statusLabel[status]} announcement updated.`);
      } else {
        const created = await announcementsApi.create(payload);
        setAnnouncements((previous) => [
          { ...created, status, scheduledFor: payload.scheduledFor },
          ...previous,
        ]);
        setFeedback(
          status === "published"
            ? "Announcement sent to your enrolled students."
            : status === "draft"
              ? "Announcement saved as a draft."
              : "Announcement scheduled successfully.",
        );
      }
      setActiveTab(status);
      clearComposer(values.courseId);
    } catch (error) {
      console.error(error);
      setFeedback(
        `We could not ${editingId ? "update" : "save"} this announcement right now.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const editAnnouncement = (announcement: Announcement) => {
    reset({
      courseId: announcement.courseId,
      subject: announcement.subject,
      message: announcement.message,
    });
    setScheduledFor(toDateTimeInput(announcement.scheduledFor));
    setEditingId(announcement.id);
    setFeedback(
      `Editing ${statusLabel[getStatus(announcement)].toLowerCase()} announcement.`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteAnnouncement = async (announcement: Announcement) => {
    if (
      !window.confirm(
        `Delete “${announcement.subject}”? This cannot be undone.`,
      )
    )
      return;
    setSubmitting(true);
    try {
      await announcementsApi.remove(announcement.id);
      setAnnouncements((previous) =>
        previous.filter((item) => item.id !== announcement.id),
      );
      if (editingId === announcement.id) clearComposer();
      setFeedback("Announcement deleted.");
    } catch (error) {
      console.error(error);
      setFeedback("We could not delete this announcement right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Instructor announcements</h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Publish now, save a draft, or schedule a course update for later.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-saffron-600" />
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {editingId ? "Edit announcement" : "Compose update"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => clearComposer(watch("courseId"))}
                className="text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                Cancel edit
              </button>
            )}
          </div>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) =>
              saveAnnouncement(values, "published"),
            )}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Course
              </label>
              {loadingCourses ? (
                <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-3 text-sm text-ink-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your courses...
                </div>
              ) : (
                <>
                  <select
                    {...register("courseId")}
                    className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 outline-none"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {errors.courseId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.courseId.message}
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Subject
              </label>
              <input
                {...register("subject")}
                placeholder="Lesson reminder, schedule change, new resource..."
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 outline-none"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.subject.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Message
              </label>
              <textarea
                {...register("message")}
                rows={7}
                placeholder="Write a clear announcement for your students..."
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 outline-none"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.message.message}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-ink-700">
                <CalendarClock className="h-4 w-4 text-blue-600" />
                Schedule for later
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                min={toDateTimeInput(new Date().toISOString())}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none"
              />
              <p className="mt-1 text-xs text-ink-500">
                Choose a future time, then select Schedule.
              </p>
            </div>
            {feedback && (
              <div className="rounded-xl border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm text-saffron-700">
                {feedback}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-500">
                {selectedCourse
                  ? `For ${selectedCourse.title}`
                  : "Select a course to continue."}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit((values) =>
                    saveAnnouncement(values, "draft"),
                  )}
                  className="btn-secondary disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Save as draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit((values) =>
                    saveAnnouncement(values, "scheduled"),
                  )}
                  className="btn-secondary disabled:opacity-60"
                >
                  <CalendarClock className="h-4 w-4" />
                  Schedule
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? "Saving..." : "Publish now"}
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Announcements
            </h2>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">
              {announcements.length} total
            </span>
          </div>
          <div
            className="mb-4 flex gap-1 rounded-xl bg-ink-50 p-1"
            role="tablist"
            aria-label="Announcement status"
          >
            {(["published", "scheduled", "draft"] as AnnouncementStatus[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === status}
                  onClick={() => setActiveTab(status)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition ${activeTab === status ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"}`}
                >
                  {statusLabel[status]} ({tabCount(status)})
                </button>
              ),
            )}
          </div>
          {loadingAnnouncements ? (
            <div className="flex items-center justify-center py-10 text-sm text-ink-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading announcements...
            </div>
          ) : visibleAnnouncements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
              No {statusLabel[activeTab].toLowerCase()} announcements yet.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAnnouncements.map((announcement) => {
                const status = getStatus(announcement);
                return (
                  <div
                    key={announcement.id}
                    className="rounded-2xl border border-ink-100 bg-ink-50 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-900">
                        {announcement.subject}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[status]}`}
                      >
                        {statusLabel[status]}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-ink-500">
                      {announcement.courseTitle}
                    </p>
                    <p className="text-sm leading-6 text-ink-700">
                      {announcement.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
                      {status === "scheduled" && announcement.scheduledFor
                        ? `Publishes ${format(new Date(announcement.scheduledFor), "MMM d, yyyy, h:mm a")}`
                          : status === "published"
                            ? `Published ${formatDate(announcement.createdAt)}`
                            : `Saved ${formatDate(announcement.createdAt)}`}
                      </p>
                      {status !== "published" && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${announcement.subject}`}
                            onClick={() => editAnnouncement(announcement)}
                            className="rounded-lg p-1.5 text-ink-500 hover:bg-white hover:text-ink-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${announcement.subject}`}
                            onClick={() => deleteAnnouncement(announcement)}
                            className="rounded-lg p-1.5 text-ink-500 hover:bg-white hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

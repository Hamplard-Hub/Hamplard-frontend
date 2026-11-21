'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ChevronLeft, Save, Send } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { useToastContext } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';
import { CurriculumBuilder } from '@/components/instructor/CurriculumBuilder';

// ── schema ────────────────────────────────────────────────────────────────

const courseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be 5000 characters or fewer'),
  category: z.string().min(1, 'Choose a category'),
  level: z.string().min(1, 'Choose a level'),
  language: z.string().min(1, 'Choose a language'),
  price: z
    .number({ error: 'Enter a valid price' })
    .min(0, 'Price cannot be negative')
    .max(100000, 'Price is too high'),
  thumbnailUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^https?:\/\/.+/i.test(value),
      'Enter a valid URL',
    ),
  previewVideoUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^https?:\/\/.+/i.test(value),
      'Enter a valid URL',
    ),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;
type CourseFormField = keyof CourseFormValues;

// ── constants ─────────────────────────────────────────────────────────────

const TABS = ['Details', 'Curriculum', 'Pricing', 'Media', 'Settings'] as const;
type Tab = (typeof TABS)[number];

const TAB_FIELDS: Record<Tab, CourseFormField[]> = {
  Details: ['title', 'description', 'category', 'level', 'language'],
  Curriculum: [],
  Pricing: ['price'],
  Media: ['thumbnailUrl', 'previewVideoUrl'],
  Settings: [],
};

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  Details: 'The basics learners see in the course catalogue.',
  Curriculum: 'Organise modules and lessons, then drag them into order.',
  Pricing: 'Set the price learners pay in USDC.',
  Media: 'Update the thumbnail and preview video.',
  Settings: 'Review the course status and send it for review.',
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];
const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Arabic',
  'Chinese',
];

const EMPTY_DEFAULTS: CourseFormValues = {
  title: '',
  description: '',
  category: '',
  level: '',
  language: '',
  price: 0,
  thumbnailUrl: '',
  previewVideoUrl: '',
};

// ── helpers ───────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
      {message}
    </p>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-rose-500">
      *
    </span>
  );
}

/** Picks only the fields that belong to a tab. */
function pickFields(
  values: CourseFormValues,
  fields: CourseFormField[],
): Partial<CourseFormValues> {
  const payload: Partial<CourseFormValues> = {};
  fields.forEach((field) => {
    (payload as Record<string, unknown>)[field] = values[field];
  });
  return payload;
}

// ── unsaved changes dialog ────────────────────────────────────────────────

interface UnsavedChangesDialogProps {
  message: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function UnsavedChangesDialog({
  message,
  onSave,
  onDiscard,
  onCancel,
  isSaving,
}: UnsavedChangesDialogProps) {
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    saveRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-message"
        className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-lifted"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-50 text-saffron-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="unsaved-changes-title"
              className="text-lg font-semibold text-hamplard-deep"
            >
              Unsaved changes
            </h2>
            <p id="unsaved-changes-message" className="mt-1 text-sm text-ink-500">
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Keep editing
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={onDiscard}
            disabled={isSaving}
          >
            Discard changes
          </button>
          <button
            ref={saveRef}
            type="button"
            className="btn-primary"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────

export default function CourseEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToastContext();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [categories, setCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [curriculumDirty, setCurriculumDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    { type: 'tab'; tab: Tab } | { type: 'leave' } | null
  >(null);

  const {
    register,
    reset,
    resetField,
    trigger,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    mode: 'onBlur',
    defaultValues: EMPTY_DEFAULTS,
  });

  // ── load the course ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    coursesApi
      .get(params.id)
      .then((loaded) => {
        if (cancelled) return;
        setCourse(loaded);
        reset({
          title: loaded.title ?? '',
          description: loaded.description ?? '',
          category: loaded.category ?? '',
          level: loaded.level ?? '',
          language: loaded.language ?? '',
          price: loaded.price ?? 0,
          thumbnailUrl: loaded.thumbnailUrl ?? '',
          previewVideoUrl: loaded.previewVideoUrl ?? '',
        });
      })
      .catch(() => {
        if (cancelled) return;
        toast.error({
          title: 'Course not found',
          description: 'Unable to load this course.',
        });
        router.push('/dashboard/instructor/courses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, reset, router, toast]);

  useEffect(() => {
    coursesApi
      .getCategories()
      .then((list) => setCategories(list.map((category) => category.name)))
      .catch(() => setCategories([]));
  }, []);

  // ── dirty tracking ───────────────────────────────────────────────────────

  const dirtyTabs = useMemo(
    () =>
      TABS.filter((tab) =>
        TAB_FIELDS[tab].some((field) => Boolean(dirtyFields[field])),
      ),
    [dirtyFields],
  );

  const hasUnsavedChanges = dirtyTabs.length > 0 || curriculumDirty;

  // Warn before the browser navigates away with unsaved work.
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Legacy browsers need returnValue set for the prompt to appear.
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ── saving ───────────────────────────────────────────────────────────────

  const saveTab = useCallback(
    async (tab: Tab): Promise<boolean> => {
      const fields = TAB_FIELDS[tab];
      const values = getValues();

      if (fields.length > 0) {
        const isValid = await trigger(fields);
        if (!isValid) {
          toast.error({
            title: 'Check the highlighted fields',
            description: 'Fix the errors before saving this section.',
          });
          return false;
        }
      }

      const payload = pickFields(values, fields);

      // The Curriculum and Settings tabs have no form fields of their own —
      // the builder autosaves its own structure, so there is nothing to push.
      if (Object.keys(payload).length === 0) {
        toast.success({
          title: `${tab} saved`,
          description: 'Your changes have been stored as a draft.',
        });
        return true;
      }

      setIsSaving(true);
      try {
        await coursesApi.update(params.id, payload);
        fields.forEach((field) =>
          resetField(field, { defaultValue: values[field] }),
        );
        toast.success({
          title: `${tab} saved`,
          description: 'Your changes have been stored as a draft.',
        });
        return true;
      } catch {
        toast.error({
          title: 'Save failed',
          description: 'We could not save your changes. Please try again.',
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [getValues, params.id, resetField, toast, trigger],
  );

  const handleSaveDraft = async () => {
    const saved = await saveTab(activeTab);
    if (saved) setCurriculumDirty(false);
  };

  const handleSubmitForReview = async () => {
    const isValid = await trigger(Object.keys(EMPTY_DEFAULTS) as CourseFormField[]);
    if (!isValid) {
      const firstInvalidTab = TABS.find((tab) =>
        TAB_FIELDS[tab].some((field) => Boolean(errors[field])),
      );
      if (firstInvalidTab) setActiveTab(firstInvalidTab);
      toast.error({
        title: 'Check the highlighted fields',
        description: 'Resolve the errors before submitting for review.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const values = getValues();
      // The backend rejects empty URLs, so blank media fields are left out.
      const payload: Partial<CourseFormValues> = {
        ...values,
        ...(values.thumbnailUrl ? {} : { thumbnailUrl: undefined }),
        ...(values.previewVideoUrl ? {} : { previewVideoUrl: undefined }),
      };
      await coursesApi.update(params.id, payload);
      await coursesApi.submitForReview(params.id);
      toast.success({
        title: 'Submitted for review',
        description: 'Our team will review your course shortly.',
      });
      router.push('/dashboard/instructor/courses');
    } catch {
      toast.error({
        title: 'Submission failed',
        description: 'We could not submit your course. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── navigation with the unsaved-changes guard ────────────────────────────

  const requestTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'tab', tab });
      return;
    }
    setActiveTab(tab);
  };

  const requestLeave = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'leave' });
      return;
    }
    router.push('/dashboard/instructor/courses');
  };

  const handleDialogSave = async () => {
    const saved = await saveTab(activeTab);
    if (!saved) return;

    setCurriculumDirty(false);
    const pending = pendingNavigation;
    setPendingNavigation(null);
    if (pending?.type === 'tab') setActiveTab(pending.tab);
    else router.push('/dashboard/instructor/courses');
  };

  const handleDialogDiscard = () => {
    const pending = pendingNavigation;
    setPendingNavigation(null);
    reset(EMPTY_DEFAULTS);
    setCurriculumDirty(false);
    if (pending?.type === 'tab') setActiveTab(pending.tab);
    else router.push('/dashboard/instructor/courses');
  };

  // ── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-ink-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-ink-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-ink-100" />
      </div>
    );
  }

  if (!course) return null;

  const thumbnailUrl = watch('thumbnailUrl');
  const canSubmitForReview = course.status === 'DRAFT' || course.status === 'PENDING';

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestLeave}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to courses
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="section-heading truncate">Edit course</h1>
          <p className="mt-0.5 truncate text-sm text-ink-500">{course.title}</p>
        </div>

        {hasUnsavedChanges && (
          <span
            className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-50 px-2.5 py-1 text-xs font-medium text-saffron-700"
            data-testid="unsaved-badge"
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Unsaved changes
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveDraft}
            disabled={isSaving || isSubmitting}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmitForReview}
            disabled={isSubmitting || isSaving || !canSubmitForReview}
            title={
              canSubmitForReview
                ? 'Send this course to the Hamplard review team'
                : 'Only draft courses can be submitted for review'
            }
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="border-b border-ink-100">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Course sections">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const hasDirtySection = dirtyTabs.includes(tab);

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`tab-${tab}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab}`}
                onClick={() => requestTabChange(tab)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-saffron-500 text-hamplard-deep'
                    : 'border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-800',
                )}
              >
                {tab}
                {hasDirtySection && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-saffron-500"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── panel ── */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="space-y-5"
      >
        <p className="text-sm text-ink-500">{TAB_DESCRIPTIONS[activeTab]}</p>

        {activeTab === 'Details' && (
          <div className="card space-y-5 p-6">
            <div>
              <label htmlFor="title" className="label">
                Title<RequiredMark />
              </label>
              <input
                id="title"
                type="text"
                className="input"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                {...register('title')}
              />
              <span id="title-error">
                <FieldError message={errors.title?.message} />
              </span>
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                className="textarea"
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="category" className="label">
                  Category<RequiredMark />
                </label>
                <select
                  id="category"
                  className="select"
                  aria-invalid={Boolean(errors.category)}
                  {...register('category')}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.category?.message} />
              </div>

              <div>
                <label htmlFor="level" className="label">
                  Level<RequiredMark />
                </label>
                <select
                  id="level"
                  className="select"
                  aria-invalid={Boolean(errors.level)}
                  {...register('level')}
                >
                  <option value="">Select a level</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.level?.message} />
              </div>

              <div>
                <label htmlFor="language" className="label">
                  Language<RequiredMark />
                </label>
                <select
                  id="language"
                  className="select"
                  aria-invalid={Boolean(errors.language)}
                  {...register('language')}
                >
                  <option value="">Select a language</option>
                  {LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.language?.message} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Curriculum' && (
          <CurriculumBuilder
            courseId={course.id}
            modules={course.modules ?? []}
            onDirtyChange={setCurriculumDirty}
          />
        )}

        {activeTab === 'Pricing' && (
          <div className="card max-w-md space-y-5 p-6">
            <div>
              <label htmlFor="price" className="label">
                Price (USDC)<RequiredMark />
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-500"
                >
                  $
                </span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input pl-8"
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? 'price-error' : 'price-hint'}
                  {...register('price', { setValueAs: (value) => (value === '' ? NaN : Number(value)) })}
                />
              </div>
              <span id="price-error">
                <FieldError message={errors.price?.message} />
              </span>
              <p id="price-hint" className="mt-1.5 text-xs text-ink-500">
                Set the price to 0 to offer this course for free.
              </p>
            </div>

            <div>
              <span className="label">Platform fee</span>
              <p className="rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
                {course.platformFeePercent}% — set by Hamplard and cannot be changed.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Media' && (
          <div className="card max-w-2xl space-y-5 p-6">
            <div>
              <label htmlFor="thumbnailUrl" className="label">
                Thumbnail URL
              </label>
              <input
                id="thumbnailUrl"
                type="url"
                placeholder="https://…"
                className="input"
                aria-invalid={Boolean(errors.thumbnailUrl)}
                {...register('thumbnailUrl')}
              />
              <FieldError message={errors.thumbnailUrl?.message} />
              {thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt="Course thumbnail preview"
                  className="mt-3 h-36 w-full rounded-xl object-cover"
                />
              )}
            </div>

            <div>
              <label htmlFor="previewVideoUrl" className="label">
                Preview video URL
              </label>
              <input
                id="previewVideoUrl"
                type="url"
                placeholder="https://…"
                className="input"
                aria-invalid={Boolean(errors.previewVideoUrl)}
                {...register('previewVideoUrl')}
              />
              <FieldError message={errors.previewVideoUrl?.message} />
              <p className="mt-1.5 text-xs text-ink-500">
                A short preview shown on the course page before enrolling.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="max-w-2xl space-y-4">
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-hamplard-deep">Course status</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-ink-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={cn(
                        'badge',
                        course.status === 'ACTIVE'
                          ? 'badge-active'
                          : course.status === 'PENDING'
                            ? 'badge-pending'
                            : course.status === 'PAUSED'
                              ? 'badge-paused'
                              : 'badge-draft',
                      )}
                    >
                      {course.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-500">Course ID</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-ink-700">
                    {course.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-500">Enrolled students</dt>
                  <dd className="mt-1 text-sm text-ink-700">
                    {course.totalEnrollments ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-ink-700">
                    {new Date(course.updatedAt ?? course.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card border-saffron-200 bg-saffron-50/60 p-6">
              <h2 className="text-sm font-semibold text-hamplard-deep">
                Ready to publish?
              </h2>
              <p className="mt-1.5 text-sm text-ink-600">
                Submitting sends this course to the Hamplard review team. You can
                keep editing it while it is under review.
              </p>
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={handleSubmitForReview}
                disabled={isSubmitting || !canSubmitForReview}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Submitting…' : 'Submit for review'}
              </button>
              {!canSubmitForReview && (
                <p className="mt-2 text-xs text-ink-500">
                  Only draft courses can be submitted for review.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {pendingNavigation && (
        <UnsavedChangesDialog
          message={
            pendingNavigation.type === 'tab'
              ? 'You have unsaved changes. Save them before switching sections.'
              : 'You have unsaved changes. Save them before leaving this page.'
          }
          onSave={handleDialogSave}
          onDiscard={handleDialogDiscard}
          onCancel={() => setPendingNavigation(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  GripVertical,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { curriculumApi } from '@/lib/api/services';
import { useToastContext } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';
import type { CourseModule, Lesson, LessonType } from '@/types';

// ── constants ──────────────────────────────────────────────────────────────

const LESSON_TYPE_META: Record<
  LessonType,
  { label: string; Icon: typeof Video; badge: string }
> = {
  VIDEO: { label: 'Video', Icon: Video, badge: 'bg-saffron-50 text-saffron-700' },
  TEXT: { label: 'Text', Icon: FileText, badge: 'bg-hamplard-lilac text-hamplard-mid' },
  QUIZ: { label: 'Quiz', Icon: HelpCircle, badge: 'bg-leaf-50 text-leaf-700' },
  ASSIGNMENT: {
    label: 'Assignment',
    Icon: ClipboardList,
    badge: 'bg-ink-100 text-ink-700',
  },
};

const LESSON_TYPES = Object.keys(LESSON_TYPE_META) as LessonType[];

/** How long to wait after the last edit before persisting the structure. */
const AUTOSAVE_DELAY_MS = 900;

const INSTRUCTIONS_ID = 'curriculum-builder-instructions';

// ── helpers ────────────────────────────────────────────────────────────────

/** Moves an item inside an array and returns a new array. */
function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Re-numbers modules and lessons so `position` matches the visible order. */
function withPositions(modules: CourseModule[]): CourseModule[] {
  return modules.map((module, moduleIndex) => ({
    ...module,
    position: moduleIndex,
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      position: lessonIndex,
    })),
  }));
}

// ── inline rename field ────────────────────────────────────────────────────

interface InlineRenameProps {
  label: string;
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

function InlineRename({ label, initialValue, onSave, onCancel }: InlineRenameProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      className="flex min-w-0 flex-1 items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (trimmed) onSave(trimmed);
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        aria-label={label}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onCancel();
          }
        }}
        className="input min-w-0 flex-1 py-1.5 text-sm"
      />
      <button type="submit" className="btn-primary px-3 py-1.5 text-xs" aria-label="Save name">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Save
      </button>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-xs"
        onClick={onCancel}
        aria-label="Cancel rename"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Cancel
      </button>
    </form>
  );
}

// ── delete confirmation ────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDelete({ message, onConfirm, onCancel }: ConfirmDeleteProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div
      role="group"
      aria-label="Confirm deletion"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
    >
      <span className="text-xs font-medium text-rose-800">{message}</span>
      <button
        ref={confirmRef}
        type="button"
        onClick={onConfirm}
        className="btn-danger px-3 py-1.5 text-xs"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="btn-secondary px-3 py-1.5 text-xs"
      >
        Cancel
      </button>
    </div>
  );
}

// ── lesson row ─────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: Lesson;
  index: number;
  total: number;
  isRenaming: boolean;
  isConfirmingDelete: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onRename: (title: string) => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function LessonRow({
  lesson,
  index,
  total,
  isRenaming,
  isConfirmingDelete,
  onStartRename,
  onCancelRename,
  onRename,
  onStartDelete,
  onCancelDelete,
  onDelete,
  onMoveUp,
  onMoveDown,
}: LessonRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lesson.id,
    data: { type: 'lesson', moduleId: lesson.moduleId },
  });

  const meta = LESSON_TYPE_META[lesson.type] ?? LESSON_TYPE_META.VIDEO;
  const { Icon } = meta;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-xl border border-ink-100 bg-white px-3 py-2.5',
        isDragging && 'z-10 opacity-60 shadow-lifted',
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder lesson ${lesson.title}`}
          aria-describedby={INSTRUCTIONS_ID}
          className="cursor-grab touch-none rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <span className={cn('badge', meta.badge)}>
          <Icon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {meta.label}
        </span>

        {isRenaming ? (
          <InlineRename
            label={`Rename lesson ${lesson.title}`}
            initialValue={lesson.title}
            onSave={(title) => {
              onRename(title);
              onCancelRename();
            }}
            onCancel={onCancelRename}
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-hamplard-deep">
            {lesson.title}
          </span>
        )}

        {!isRenaming && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label={`Move lesson ${lesson.title} up`}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label={`Move lesson ${lesson.title} down`}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onStartRename}
              aria-label={`Rename lesson ${lesson.title}`}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onStartDelete}
              aria-label={`Delete lesson ${lesson.title}`}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="mt-2">
          <ConfirmDelete
            message={`Delete “${lesson.title}”?`}
            onConfirm={onDelete}
            onCancel={onCancelDelete}
          />
        </div>
      )}
    </li>
  );
}

// ── module card ────────────────────────────────────────────────────────────

interface ModuleCardProps {
  module: CourseModule;
  index: number;
  total: number;
  renamingLessonId: string | null;
  confirmingLessonId: string | null;
  onRenameModule: (title: string) => void;
  onDeleteModule: () => void;
  onMoveModuleUp: () => void;
  onMoveModuleDown: () => void;
  onAddLesson: (type: LessonType) => void;
  onRenameLesson: (lessonId: string, title: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onMoveLessonUp: (lessonId: string) => void;
  onMoveLessonDown: (lessonId: string) => void;
  onStartRenameLesson: (lessonId: string) => void;
  onCancelRenameLesson: () => void;
  onStartDeleteLesson: (lessonId: string) => void;
  onCancelDeleteLesson: () => void;
}

function ModuleCard({
  module,
  index,
  total,
  renamingLessonId,
  confirmingLessonId,
  onRenameModule,
  onDeleteModule,
  onMoveModuleUp,
  onMoveModuleDown,
  onAddLesson,
  onRenameLesson,
  onDeleteLesson,
  onMoveLessonUp,
  onMoveLessonDown,
  onStartRenameLesson,
  onCancelRenameLesson,
  onStartDeleteLesson,
  onCancelDeleteLesson,
}: ModuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id, data: { type: 'module' } });

  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTypeMenu) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowTypeMenu(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTypeMenu]);

  const lessonIds = useMemo(
    () => module.lessons.map((lesson) => lesson.id),
    [module.lessons],
  );

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-label={`Module ${index + 1}: ${module.title}`}
      className={cn(
        'rounded-2xl border border-ink-100 bg-ink-50/60',
        isDragging && 'z-10 opacity-60 shadow-lifted',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder module ${module.title}`}
          aria-describedby={INSTRUCTIONS_ID}
          className="cursor-grab touch-none rounded-lg p-1 text-ink-400 transition-colors hover:bg-white hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        {isRenaming ? (
          <InlineRename
            label={`Rename module ${module.title}`}
            initialValue={module.title}
            onSave={(title) => {
              onRenameModule(title);
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsExpanded((open) => !open)}
              aria-expanded={isExpanded}
              aria-controls={`lessons-${module.id}`}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-hamplard-lilac text-xs font-bold text-hamplard-mid">
                {index + 1}
              </span>
              <span className="min-w-0 truncate text-sm font-semibold text-hamplard-deep">
                {module.title}
              </span>
              <span className="shrink-0 text-xs font-normal text-ink-500">
                {module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              )}
            </button>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onMoveModuleUp}
                disabled={index === 0}
                aria-label={`Move module ${module.title} up`}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onMoveModuleDown}
                disabled={index === total - 1}
                aria-label={`Move module ${module.title} down`}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(true)}
                aria-label={`Rename module ${module.title}`}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-ink-700"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                aria-label={`Delete module ${module.title}`}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>

      {isConfirmingDelete && !isRenaming && (
        <div className="px-4 pt-3">
          <ConfirmDelete
            message={`Delete “${module.title}” and its ${module.lessons.length} lesson${
              module.lessons.length === 1 ? '' : 's'
            }?`}
            onConfirm={() => {
              setIsConfirmingDelete(false);
              onDeleteModule();
            }}
            onCancel={() => setIsConfirmingDelete(false)}
          />
        </div>
      )}

      {isExpanded && (
        <div id={`lessons-${module.id}`} className="space-y-3 px-4 py-4">
          <SortableContext
            items={lessonIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2" aria-label={`Lessons in ${module.title}`}>
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={lessonIndex}
                  total={module.lessons.length}
                  isRenaming={renamingLessonId === lesson.id}
                  isConfirmingDelete={confirmingLessonId === lesson.id}
                  onStartRename={() => onStartRenameLesson(lesson.id)}
                  onCancelRename={onCancelRenameLesson}
                  onRename={(title) => onRenameLesson(lesson.id, title)}
                  onStartDelete={() => onStartDeleteLesson(lesson.id)}
                  onCancelDelete={onCancelDeleteLesson}
                  onDelete={() => onDeleteLesson(lesson.id)}
                  onMoveUp={() => onMoveLessonUp(lesson.id)}
                  onMoveDown={() => onMoveLessonDown(lesson.id)}
                />
              ))}
            </ul>
          </SortableContext>

          {module.lessons.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
              No lessons yet — add a video, text, quiz or assignment.
            </p>
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowTypeMenu((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={showTypeMenu}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add lesson
            </button>

            {showTypeMenu && (
              <div
                role="menu"
                aria-label={`Add lesson to ${module.title}`}
                className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-ink-100 bg-white p-1 shadow-lifted"
              >
                {LESSON_TYPES.map((type) => {
                  const { label, Icon } = LESSON_TYPE_META[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowTypeMenu(false);
                        onAddLesson(type);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      <Icon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      {label} lesson
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── builder ────────────────────────────────────────────────────────────────

export interface CurriculumBuilderProps {
  courseId: string;
  modules: CourseModule[];
  /** Reports whether the curriculum has unsaved changes to the parent page. */
  onDirtyChange?: (dirty: boolean) => void;
}

export function CurriculumBuilder({
  courseId,
  modules: initialModules,
  onDirtyChange,
}: CurriculumBuilderProps) {
  const toast = useToastContext();
  const [modules, setModules] = useState<CourseModule[]>(() =>
    withPositions(initialModules),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [renamingLessonId, setRenamingLessonId] = useState<string | null>(null);
  const [confirmingLessonId, setConfirmingLessonId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Load the persisted structure (which may contain earlier re-orderings).
  useEffect(() => {
    let cancelled = false;

    curriculumApi
      .getModules(courseId, initialModules)
      .then((loaded) => {
        if (cancelled) return;
        setModules(withPositions(loaded));
        hasLoaded.current = true;
      })
      .catch(() => {
        hasLoaded.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, initialModules]);

  // Autosave the structure shortly after any change.
  const scheduleAutosave = useCallback(
    (next: CourseModule[]) => {
      if (!hasLoaded.current) return;

      onDirtyChange?.(true);

      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await curriculumApi.reorderModules(courseId, next);
          setStatusMessage('Curriculum saved');
          onDirtyChange?.(false);
        } catch {
          setStatusMessage('Could not save the curriculum — try again');
          toast.error({
            title: 'Autosave failed',
            description: 'Your curriculum changes were not saved.',
          });
        } finally {
          setIsSaving(false);
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [courseId, onDirtyChange, toast],
  );

  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    },
    [],
  );

  const updateModules = useCallback(
    (updater: (current: CourseModule[]) => CourseModule[]) => {
      setModules((current) => {
        const next = withPositions(updater(current));
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave],
  );

  // ── drag and drop ────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType !== overType) return;

    if (activeType === 'module') {
      const from = modules.findIndex((module) => module.id === active.id);
      const to = modules.findIndex((module) => module.id === over.id);
      if (from < 0 || to < 0) return;

      const moved = modules[from];
      updateModules((current) => moveItem(current, from, to));
      setStatusMessage(
        `Module “${moved.title}” moved to position ${to + 1} of ${modules.length}`,
      );
      return;
    }

    if (activeType === 'lesson') {
      const moduleId = active.data.current?.moduleId;
      const overModuleId = over.data.current?.moduleId;
      // Lessons only reorder inside their own module.
      if (!moduleId || moduleId !== overModuleId) return;

      const moduleIndex = modules.findIndex((module) => module.id === moduleId);
      if (moduleIndex < 0) return;

      const target = modules[moduleIndex];
      const from = target.lessons.findIndex((lesson) => lesson.id === active.id);
      const to = target.lessons.findIndex((lesson) => lesson.id === over.id);
      if (from < 0 || to < 0) return;

      const moved = target.lessons[from];
      updateModules((current) =>
        current.map((module, index) =>
          index === moduleIndex
            ? { ...module, lessons: moveItem(module.lessons, from, to) }
            : module,
        ),
      );
      setStatusMessage(
        `Lesson “${moved.title}” moved to position ${to + 1} of ${target.lessons.length}`,
      );
    }
  };

  // ── keyboard / button reordering ─────────────────────────────────────────

  const moveModule = (moduleId: string, direction: -1 | 1) => {
    const from = modules.findIndex((module) => module.id === moduleId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= modules.length) return;

    const moved = modules[from];
    updateModules((current) => moveItem(current, from, to));
    setStatusMessage(
      `Module “${moved.title}” moved to position ${to + 1} of ${modules.length}`,
    );
  };

  const moveLesson = (moduleId: string, lessonId: string, direction: -1 | 1) => {
    const moduleIndex = modules.findIndex((module) => module.id === moduleId);
    if (moduleIndex < 0) return;

    const lessons = modules[moduleIndex].lessons;
    const from = lessons.findIndex((lesson) => lesson.id === lessonId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= lessons.length) return;

    const moved = lessons[from];
    updateModules((current) =>
      current.map((module, index) =>
        index === moduleIndex
          ? { ...module, lessons: moveItem(module.lessons, from, to) }
          : module,
      ),
    );
    setStatusMessage(
      `Lesson “${moved.title}” moved to position ${to + 1} of ${lessons.length}`,
    );
  };

  // ── mutations ────────────────────────────────────────────────────────────

  const handleAddModule = async () => {
    try {
      const created = await curriculumApi.createModule(
        courseId,
        `Module ${modules.length + 1}`,
        modules.length,
      );
      updateModules((current) => [...current, created]);
      setStatusMessage(`Module “${created.title}” added`);
      toast.success({ title: 'Module added', description: created.title });
    } catch {
      toast.error({
        title: 'Could not add module',
        description: 'Please try again.',
      });
    }
  };

  const handleAddLesson = async (moduleId: string, type: LessonType) => {
    const module = modules.find((item) => item.id === moduleId);
    if (!module) return;

    try {
      const created = await curriculumApi.createLesson(courseId, moduleId, {
        title: `New ${LESSON_TYPE_META[type].label} lesson`,
        type,
        position: module.lessons.length,
      });
      updateModules((current) =>
        current.map((item) =>
          item.id === moduleId
            ? { ...item, lessons: [...item.lessons, created] }
            : item,
        ),
      );
      setStatusMessage(`Lesson added to ${module.title}`);
    } catch {
      toast.error({
        title: 'Could not add lesson',
        description: 'Please try again.',
      });
    }
  };

  const handleRenameModule = async (moduleId: string, title: string) => {
    await curriculumApi.renameModule(courseId, moduleId, title);
    updateModules((current) =>
      current.map((module) =>
        module.id === moduleId ? { ...module, title } : module,
      ),
    );
    setStatusMessage(`Module renamed to “${title}”`);
  };

  const handleDeleteModule = async (moduleId: string) => {
    const module = modules.find((item) => item.id === moduleId);
    await curriculumApi.deleteModule(courseId, moduleId);
    updateModules((current) => current.filter((item) => item.id !== moduleId));
    setStatusMessage(`Module “${module?.title ?? ''}” deleted`);
    toast.success({
      title: 'Module deleted',
      description: module?.title,
    });
  };

  const handleRenameLesson = async (
    moduleId: string,
    lessonId: string,
    title: string,
  ) => {
    await curriculumApi.renameLesson(courseId, lessonId, title);
    updateModules((current) =>
      current.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, title } : lesson,
              ),
            }
          : module,
      ),
    );
    setStatusMessage(`Lesson renamed to “${title}”`);
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    const lesson = modules
      .find((module) => module.id === moduleId)
      ?.lessons.find((item) => item.id === lessonId);

    await curriculumApi.deleteLesson(courseId, lessonId);
    updateModules((current) =>
      current.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter((item) => item.id !== lessonId),
            }
          : module,
      ),
    );
    setStatusMessage(`Lesson “${lesson?.title ?? ''}” deleted`);
    toast.success({ title: 'Lesson deleted', description: lesson?.title });
  };

  const activeDragLabel = useMemo(() => {
    if (!activeDragId) return null;
    const module = modules.find((item) => item.id === activeDragId);
    if (module) return module.title;
    for (const item of modules) {
      const lesson = item.lessons.find((entry) => entry.id === activeDragId);
      if (lesson) return lesson.title;
    }
    return null;
  }, [activeDragId, modules]);

  return (
    <div className="space-y-4">
      <p id={INSTRUCTIONS_ID} className="sr-only">
        To reorder with the keyboard, focus the drag handle and press space to
        pick up an item, use the arrow keys to move it, then press space again
        to drop it. Every item also has Move up and Move down buttons.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-hamplard-deep">Curriculum</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            {modules.length} module{modules.length === 1 ? '' : 's'} ·{' '}
            {modules.reduce((total, module) => total + module.lessons.length, 0)}{' '}
            lesson
            {modules.reduce((total, module) => total + module.lessons.length, 0) === 1
              ? ''
              : 's'}
          </p>
        </div>
        <p
          aria-live="polite"
          className="text-xs font-medium text-ink-500"
          data-testid="curriculum-status"
        >
          {isSaving ? 'Saving…' : statusMessage}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext
          items={modules.map((module) => module.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                total={modules.length}
                renamingLessonId={renamingLessonId}
                confirmingLessonId={confirmingLessonId}
                onRenameModule={(title) => handleRenameModule(module.id, title)}
                onDeleteModule={() => handleDeleteModule(module.id)}
                onMoveModuleUp={() => moveModule(module.id, -1)}
                onMoveModuleDown={() => moveModule(module.id, 1)}
                onAddLesson={(type) => handleAddLesson(module.id, type)}
                onRenameLesson={(lessonId, title) =>
                  handleRenameLesson(module.id, lessonId, title)
                }
                onDeleteLesson={(lessonId) => handleDeleteLesson(module.id, lessonId)}
                onMoveLessonUp={(lessonId) => moveLesson(module.id, lessonId, -1)}
                onMoveLessonDown={(lessonId) => moveLesson(module.id, lessonId, 1)}
                onStartRenameLesson={(lessonId) => setRenamingLessonId(lessonId)}
                onCancelRenameLesson={() => setRenamingLessonId(null)}
                onStartDeleteLesson={(lessonId) => setConfirmingLessonId(lessonId)}
                onCancelDeleteLesson={() => setConfirmingLessonId(null)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeDragLabel ? (
            <div className="rounded-xl border border-hamplard-primary bg-white px-4 py-2 text-sm font-medium text-hamplard-deep shadow-lifted">
              {activeDragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modules.length === 0 && (
        <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-500">
          This course has no modules yet. Add your first one to start building
          the curriculum.
        </p>
      )}

      <button
        type="button"
        onClick={handleAddModule}
        className="btn-secondary w-full justify-center border-dashed"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add module
      </button>
    </div>
  );
}

export default CurriculumBuilder;

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getModules, reorderModules, renameLesson, deleteLesson, createLesson } =
  vi.hoisted(() => ({
    getModules: vi.fn(),
    reorderModules: vi.fn(),
    renameLesson: vi.fn(),
    deleteLesson: vi.fn(),
    createLesson: vi.fn(),
  }));

vi.mock('@/lib/api/services', () => ({
  curriculumApi: {
    getModules,
    reorderModules,
    renameLesson,
    deleteLesson,
    createLesson,
    createModule: vi.fn(),
    renameModule: vi.fn(),
    deleteModule: vi.fn(),
  },
}));

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/components/ui/ToastProvider', () => ({
  useToastContext: () => toast,
}));

import { CurriculumBuilder } from '../CurriculumBuilder';
import type { CourseModule } from '@/types';

const module = (id: string, title: string, lessons: CourseModule['lessons'] = []): CourseModule => ({
  id,
  courseId: 'course-1',
  title,
  position: 0,
  lessons,
});

const lesson = (id: string, title: string, moduleId: string) => ({
  id,
  moduleId,
  title,
  description: null,
  type: 'VIDEO' as const,
  videoUrl: null,
  videoDuration: null,
  content: null,
  resourceUrl: null,
  position: 0,
  isFree: false,
});

const MODULES: CourseModule[] = [
  module('m1', 'Getting started', [
    lesson('l1', 'Welcome', 'm1'),
    lesson('l2', 'Setting up', 'm1'),
  ]),
  module('m2', 'Advanced topics', []),
];

describe('CurriculumBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModules.mockImplementation(async (_courseId: string, serverModules: CourseModule[]) =>
      serverModules,
    );
    reorderModules.mockResolvedValue(undefined);
    renameLesson.mockResolvedValue(undefined);
    deleteLesson.mockResolvedValue(undefined);
  });

  it('renders the modules and their lessons', async () => {
    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    expect(await screen.findByText('Getting started')).toBeInTheDocument();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Setting up')).toBeInTheDocument();
    expect(screen.getByText('Advanced topics')).toBeInTheDocument();
  });

  it('reorders a lesson with the keyboard alternative buttons and autosaves', async () => {
    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    await screen.findByText('Welcome');

    fireEvent.click(screen.getByRole('button', { name: 'Move lesson Setting up up' }));

    await waitFor(() => expect(reorderModules).toHaveBeenCalledTimes(1));

    const [courseId, savedModules] = reorderModules.mock.calls[0];
    expect(courseId).toBe('course-1');
    expect(savedModules[0].lessons.map((entry: { title: string }) => entry.title)).toEqual([
      'Setting up',
      'Welcome',
    ]);
  });

  it('reorders a module with the keyboard alternative buttons and autosaves', async () => {
    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    await screen.findByText('Getting started');

    fireEvent.click(screen.getByRole('button', { name: 'Move module Advanced topics up' }));

    await waitFor(() => expect(reorderModules).toHaveBeenCalledTimes(1));

    const [, savedModules] = reorderModules.mock.calls[0];
    expect(savedModules.map((entry: { title: string }) => entry.title)).toEqual([
      'Advanced topics',
      'Getting started',
    ]);
  });

  it('renames a lesson inline', async () => {
    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    await screen.findByText('Welcome');

    fireEvent.click(screen.getByRole('button', { name: 'Rename lesson Welcome' }));

    const input = screen.getByRole('textbox', { name: 'Rename lesson Welcome' });
    fireEvent.change(input, { target: { value: 'Welcome aboard' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }));

    await waitFor(() =>
      expect(renameLesson).toHaveBeenCalledWith('course-1', 'l1', 'Welcome aboard'),
    );
    expect(await screen.findByText('Welcome aboard')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting a lesson', async () => {
    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    await screen.findByText('Welcome');

    fireEvent.click(screen.getByRole('button', { name: 'Delete lesson Welcome' }));

    expect(screen.getByText('Delete “Welcome”?')).toBeInTheDocument();
    expect(deleteLesson).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteLesson).toHaveBeenCalledWith('course-1', 'l1'));
  });

  it('offers the four lesson types when adding a lesson', async () => {
    createLesson.mockResolvedValue(lesson('l3', 'New Quiz lesson', 'm1'));

    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    await screen.findByText('Getting started');

    fireEvent.click(screen.getAllByRole('button', { name: /add lesson/i })[0]);

    expect(screen.getByRole('menuitem', { name: /video lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /text lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /quiz lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /assignment lesson/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /quiz lesson/i }));

    await waitFor(() =>
      expect(createLesson).toHaveBeenCalledWith('course-1', 'm1', {
        title: 'New Quiz lesson',
        type: 'QUIZ',
        position: 2,
      }),
    );
  });

  it('exposes drag instructions for keyboard users', async () => {
    render(<CurriculumBuilder courseId="course-1" modules={MODULES} />);

    await screen.findByText('Getting started');

    const handle = screen.getByRole('button', { name: 'Reorder module Getting started' });
    expect(handle).toHaveAttribute(
      'aria-describedby',
      screen.getByText(/press space to pick up an item/i).id,
    );
  });
});

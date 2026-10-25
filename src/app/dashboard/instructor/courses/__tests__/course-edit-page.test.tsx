import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCourse, updateCourse, submitForReview, getCategories } = vi.hoisted(() => ({
  getCourse: vi.fn(),
  updateCourse: vi.fn(),
  submitForReview: vi.fn(),
  getCategories: vi.fn(),
}));

vi.mock('@/lib/api/services', () => ({
  coursesApi: {
    get: getCourse,
    update: updateCourse,
    submitForReview,
    getCategories,
  },
}));

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/components/ui/ToastProvider', () => ({
  useToastContext: () => toast,
}));

const { push, router } = vi.hoisted(() => {
  const push = vi.fn();
  return { push, router: { push } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useParams: () => ({ id: 'course-1' }),
}));

vi.mock('@/components/instructor/CurriculumBuilder', () => ({
  CurriculumBuilder: () => <div data-testid="curriculum-builder" />,
}));

import CourseEditPage from '../[id]/edit/page';
import type { Course } from '@/types';

const COURSE = {
  id: 'course-1',
  instructorAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  title: 'Tailoring fundamentals',
  description: 'Learn to cut and sew garments.',
  category: 'Tailoring',
  level: 'Beginner',
  language: 'English',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  previewVideoUrl: 'https://example.com/preview.mp4',
  price: 25,
  platformFeePercent: 10,
  status: 'DRAFT',
  totalLessons: 4,
  totalDuration: 3600,
  totalEnrollments: 12,
  totalRevenue: 300,
  txHash: null,
  approvedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  instructor: {
    name: 'Ada',
    stellarAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    avatarUrl: null,
  },
  modules: [],
  _count: { enrollments: 12 },
} as unknown as Course;

describe('Instructor course edit page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCourse.mockResolvedValue(COURSE);
    updateCourse.mockResolvedValue(COURSE);
    submitForReview.mockResolvedValue(COURSE);
    getCategories.mockResolvedValue([{ id: 'c1', name: 'Tailoring' }]);
  });

  it('renders the five course sections', async () => {
    render(<CourseEditPage />);

    expect(await screen.findByRole('tab', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Curriculum' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pricing' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Media' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
  });

  it('prefills the form with the course details', async () => {
    render(<CourseEditPage />);

    const title = await screen.findByLabelText(/title/i);
    expect(title).toHaveValue('Tailoring fundamentals');
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'Learn to cut and sew garments.',
    );
    expect(screen.getByLabelText(/category/i)).toHaveValue('Tailoring');
    expect(screen.getByLabelText(/level/i)).toHaveValue('Beginner');
    expect(screen.getByLabelText(/language/i)).toHaveValue('English');
  });

  it('saves the active tab as a draft', async () => {
    render(<CourseEditPage />);

    const title = await screen.findByLabelText(/title/i);
    fireEvent.change(title, { target: { value: 'Tailoring fundamentals v2' } });
    fireEvent.blur(title);

    await waitFor(() => expect(screen.getByTestId('unsaved-badge')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => expect(updateCourse).toHaveBeenCalledTimes(1));
    expect(updateCourse.mock.calls[0][0]).toBe('course-1');
    expect(updateCourse.mock.calls[0][1]).toMatchObject({
      title: 'Tailoring fundamentals v2',
    });
  });

  it('warns before switching sections with unsaved changes', async () => {
    render(<CourseEditPage />);

    const title = await screen.findByLabelText(/title/i);
    fireEvent.change(title, { target: { value: 'Changed' } });
    fireEvent.blur(title);

    await waitFor(() => expect(screen.getByTestId('unsaved-badge')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Pricing' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep editing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    // The tab has not switched yet.
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('discards changes and switches sections', async () => {
    render(<CourseEditPage />);

    const title = await screen.findByLabelText(/title/i);
    fireEvent.change(title, { target: { value: 'Changed' } });
    fireEvent.blur(title);

    await waitFor(() => expect(screen.getByTestId('unsaved-badge')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Pricing' }));
    fireEvent.click(await screen.findByRole('button', { name: /discard changes/i }));

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Pricing' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );
    expect(updateCourse).not.toHaveBeenCalled();
  });

  it('submits the course for review', async () => {
    render(<CourseEditPage />);

    await screen.findByLabelText(/title/i);

    fireEvent.click(screen.getAllByRole('button', { name: /submit for review/i })[0]);

    await waitFor(() => expect(submitForReview).toHaveBeenCalledWith('course-1'));
    expect(updateCourse).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/instructor/courses'));
  });
});

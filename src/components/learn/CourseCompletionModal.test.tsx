import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CourseCompletionModal from './CourseCompletionModal';

const { reducedMotionState, confettiMock } = vi.hoisted(() => ({
  reducedMotionState: { value: false },
  confettiMock: vi.fn(),
}));

vi.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => ({ prefersReducedMotion: reducedMotionState.value, mounted: true }),
}));

vi.mock('canvas-confetti', () => ({ default: confettiMock }));

describe('CourseCompletionModal reduced motion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reducedMotionState.value = false;
  });

  it('does not fire confetti when reduced motion is on', async () => {
    reducedMotionState.value = true;
    render(
      <CourseCompletionModal
        open
        courseTitle="Tailoring basics"
        courseId="course-1"
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText('Congratulations!')).toBeInTheDocument());
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it('fires confetti when reduced motion is off', async () => {
    render(
      <CourseCompletionModal
        open
        courseTitle="Tailoring basics"
        courseId="course-1"
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(confettiMock).toHaveBeenCalledTimes(1));
  });
});

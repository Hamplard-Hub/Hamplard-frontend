import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingModal } from './OnboardingModal';

const { reducedMotionState, confettiMock } = vi.hoisted(() => ({
  reducedMotionState: { value: false },
  confettiMock: vi.fn(),
}));

vi.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => ({ prefersReducedMotion: reducedMotionState.value, mounted: true }),
}));

vi.mock('canvas-confetti', () => ({ default: confettiMock }));

describe('OnboardingModal reduced motion', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
    reducedMotionState.value = false;
  });

  it('skips confetti and closes immediately with reduced motion', async () => {
    reducedMotionState.value = true;
    const onClose = vi.fn();
    render(<OnboardingModal onClose={onClose} />);

    expect(await screen.findByText('Welcome to Hamplard')).toBeInTheDocument();
    expect(document.querySelector('.animate-bounce')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it('keeps the celebration when reduced motion is off', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<OnboardingModal onClose={onClose} />);

    expect(screen.getByText('Welcome to Hamplard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(confettiMock).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1500); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

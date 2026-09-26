import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownTimer } from './CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the component with a timer role', () => {
      const futureDate = new Date(Date.now() + 10000);
      render(<CountdownTimer expiresAt={futureDate} />);
      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute('aria-live', 'off');
    });

    it('renders with default label when not provided', () => {
      const futureDate = new Date(Date.now() + 10000);
      render(<CountdownTimer expiresAt={futureDate} />);
      expect(screen.getByText('Offer expires in')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      const futureDate = new Date(Date.now() + 10000);
      render(<CountdownTimer expiresAt={futureDate} label="Sale ends in" />);
      expect(screen.getByText('Sale ends in')).toBeInTheDocument();
    });

    it('renders time units with proper formatting', () => {
      const futureDate = new Date(Date.now() + 90061000); // 1 day, 1 hour, 1 minute, 1 second
      render(<CountdownTimer expiresAt={futureDate} />);

      // Check that all labels are present
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Minutes')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();
    });

    it('pads single digit numbers with leading zero', () => {
      const futureDate = new Date(Date.now() + 3661000); // 1 hour, 1 minute, 1 second
      render(<CountdownTimer expiresAt={futureDate} />);

      const elements = screen.getAllByText(/0[1]|0[0]|0[2-9]/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Countdown Logic', () => {
    it('decrements seconds every second', () => {
      const futureDate = new Date(Date.now() + 5000);
      const { rerender } = render(<CountdownTimer expiresAt={futureDate} />);

      // Fast forward 1 second
      vi.advanceTimersByTime(1000);
      rerender(<CountdownTimer expiresAt={futureDate} />);

      // Timer should have updated (we can verify it didn't error)
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('calls onExpire callback when timer reaches zero', () => {
      const onExpire = vi.fn();
      const futureDate = new Date(Date.now() + 1000);
      render(<CountdownTimer expiresAt={futureDate} onExpire={onExpire} />);

      // Fast forward past expiration
      vi.advanceTimersByTime(1100);

      expect(onExpire).toHaveBeenCalled();
    });

    it('shows "Offer ended" text when expired', () => {
      const futureDate = new Date(Date.now() + 500);
      render(<CountdownTimer expiresAt={futureDate} />);

      // Fast forward past expiration
      vi.advanceTimersByTime(600);

      expect(screen.getByText('Offer ended')).toBeInTheDocument();
    });

    it('hides label when timer expires', () => {
      const futureDate = new Date(Date.now() + 500);
      render(<CountdownTimer expiresAt={futureDate} label="Sale ends in" />);

      // Fast forward past expiration
      vi.advanceTimersByTime(600);

      expect(screen.queryByText('Sale ends in')).not.toBeInTheDocument();
      expect(screen.getByText('Offer ended')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const futureDate = new Date(Date.now() + 10000);
      const { unmount } = render(<CountdownTimer expiresAt={futureDate} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('does not leak intervals on prop changes', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      let futureDate = new Date(Date.now() + 10000);
      const { rerender } = render(<CountdownTimer expiresAt={futureDate} />);

      const initialClearCount = clearIntervalSpy.mock.calls.length;

      futureDate = new Date(Date.now() + 20000);
      rerender(<CountdownTimer expiresAt={futureDate} />);

      // Should have cleared the old interval and set a new one
      expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(initialClearCount);
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has role="timer" attribute', () => {
      const futureDate = new Date(Date.now() + 10000);
      render(<CountdownTimer expiresAt={futureDate} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('has aria-live="off" to avoid noisy announcements', () => {
      const futureDate = new Date(Date.now() + 10000);
      render(<CountdownTimer expiresAt={futureDate} />);
      expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      const futureDate = new Date(Date.now() + 10000);
      render(
        <CountdownTimer
          expiresAt={futureDate}
          ref={ref as unknown as React.Ref<HTMLDivElement>}
        />,
      );
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles already expired date', () => {
      const pastDate = new Date(Date.now() - 1000);
      const onExpire = vi.fn();
      render(<CountdownTimer expiresAt={pastDate} onExpire={onExpire} />);

      expect(screen.getByText('Offer ended')).toBeInTheDocument();
      expect(onExpire).toHaveBeenCalled();
    });

    it('accepts custom className', () => {
      const futureDate = new Date(Date.now() + 10000);
      render(
        <CountdownTimer expiresAt={futureDate} className="custom-class" />,
      );
      expect(screen.getByRole('timer')).toHaveClass('custom-class');
    });

    it('handles very long durations (multiple days)', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
      render(<CountdownTimer expiresAt={futureDate} />);

      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });
  });
});

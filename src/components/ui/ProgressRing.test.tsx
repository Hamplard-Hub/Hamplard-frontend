import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('renders an accessible progress bar with the expected value', () => {
    render(<ProgressRing value={42} label="Lesson progress" />);

    const ring = screen.getByRole('progressbar', { name: /lesson progress/i });
    expect(ring).toHaveAttribute('aria-valuenow', '42');
    expect(ring).toHaveAttribute('aria-valuemin', '0');
    expect(ring).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows a centered percentage when enabled', () => {
    render(<ProgressRing value={75} showValue />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoPlayer } from './VideoPlayer';

vi.mock('@/lib/hooks/use-low-bandwidth', () => ({
  useLowBandwidth: () => ({ enabled: false }),
}));

describe('VideoPlayer captions preference', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('leaves the native captions default available when no choice is saved', () => {
    render(<VideoPlayer src="/lesson.mp4" captionsUrl="/captions.vtt" />);

    expect(document.querySelector('track')).toHaveAttribute('default');
  });

  it('overrides the native default for an explicit saved preference', () => {
    window.sessionStorage.setItem('hamplard-captions-enabled', 'false');

    render(<VideoPlayer src="/lesson.mp4" captionsUrl="/captions.vtt" />);

    expect(document.querySelector('track')).not.toHaveAttribute('default');
    expect(screen.getByRole('button', { name: 'Turn captions on' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('persists an explicit captions choice made in the player', async () => {
    render(<VideoPlayer src="/lesson.mp4" captionsUrl="/captions.vtt" />);

    fireEvent.click(screen.getByRole('button', { name: 'Turn captions on' }));

    expect(screen.getByRole('button', { name: 'Turn captions off' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => {
      expect(window.sessionStorage.getItem('hamplard-captions-enabled')).toBe('true');
    });
  });
});

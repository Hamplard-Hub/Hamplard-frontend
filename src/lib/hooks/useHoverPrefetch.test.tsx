import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHoverPrefetch } from './useHoverPrefetch';

// Mock next/navigation — the hook only needs router.prefetch()
const mockPrefetch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: mockPrefetch,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// jsdom does not implement window.matchMedia — stub it to simulate
// fine-pointer (desktop) vs touch devices.
const originalMatchMedia = window.matchMedia;

function stubMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Harness that wires the hook up like a real hoverable element. */
function Hoverable({ href, delayMs }: { href?: string | null; delayMs?: number }) {
  const { onMouseEnter, onMouseLeave } = useHoverPrefetch(href, delayMs ? { delayMs } : undefined);
  return (
    <div
      data-testid="hoverable"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      hover me
    </div>
  );
}

describe('useHoverPrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    stubMatchMedia(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });

  it('prefetches the href after the default 200ms hover delay', () => {
    const { getByTestId } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);

    // Not yet — the delay has not elapsed.
    expect(mockPrefetch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(mockPrefetch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    expect(mockPrefetch).toHaveBeenCalledWith('/courses/course-1');
  });

  it('honours a custom delayMs', () => {
    const { getByTestId } = render(<Hoverable href="/courses/course-1" delayMs={500} />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(mockPrefetch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
  });

  it('cancels the pending prefetch when the pointer leaves before the delay', () => {
    const { getByTestId } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.mouseLeave(el);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('does not prefetch when the pointer never rests (immediate leave)', () => {
    const { getByTestId } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    fireEvent.mouseLeave(el);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('does not prefetch on touch devices', () => {
    stubMatchMedia(false);
    const { getByTestId } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('does not prefetch when matchMedia is unavailable', () => {
    // Simulate an environment without matchMedia support.
    // @ts-expect-error — deliberately deleting a runtime global.
    delete window.matchMedia;

    const { getByTestId } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('does not prefetch when href is null or undefined', () => {
    const { getByTestId, rerender } = render(<Hoverable href={null} />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockPrefetch).not.toHaveBeenCalled();

    rerender(<Hoverable href={undefined} />);
    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('cancels the pending prefetch when the component unmounts', () => {
    const { getByTestId, unmount } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    fireEvent.mouseEnter(el);
    unmount();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('prefetches again on a subsequent hover', () => {
    const { getByTestId } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    // First hover completes.
    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(1);

    // Leave, then hover again.
    fireEvent.mouseLeave(el);
    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(2);
  });

  it('uses the latest href when it changes between renders', () => {
    const { getByTestId, rerender } = render(<Hoverable href="/courses/course-1" />);
    const el = getByTestId('hoverable');

    rerender(<Hoverable href="/courses/course-2" />);
    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    expect(mockPrefetch).toHaveBeenCalledWith('/courses/course-2');
  });
});

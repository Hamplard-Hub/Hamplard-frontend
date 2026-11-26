import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedCounter } from './AnimatedCounter';

const { reducedMotionState } = vi.hoisted(() => ({ reducedMotionState: { value: false } }));

vi.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => ({ prefersReducedMotion: reducedMotionState.value, mounted: true }),
}));

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  reducedMotionState.value = false;
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('AnimatedCounter reduced motion', () => {
  it('shows the final value immediately when reduced motion is on', () => {
    reducedMotionState.value = true;
    render(<AnimatedCounter value={1234} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it('starts from zero and animates when reduced motion is off', () => {
    let now = 0;
    let frame: FrameRequestCallback | null = null;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });

    render(<AnimatedCounter value={1234} duration={2000} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(MockIntersectionObserver.instances).toHaveLength(1);

    const observer = MockIntersectionObserver.instances[0];
    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
    });

    now = 2000;
    act(() => {
      frame?.(now);
    });

    expect(screen.getByText('1,234')).toBeInTheDocument();
  });
});

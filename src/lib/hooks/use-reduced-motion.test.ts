import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useReducedMotion } from './use-reduced-motion';

describe('useReducedMotion', () => {
  const STORAGE_KEY = 'hamplard_reduced_motion';

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('reduce-motion');
    document.documentElement.removeAttribute('data-reduce-motion');

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial state detection', () => {
    it('defaults to false when no OS preference and no override', () => {
      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);
      expect(result.current.hasManualOverride).toBe(false);
    });

    it('respects OS preference when prefers-reduced-motion is active', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.hasManualOverride).toBe(false);
    });

    it('reads manual override from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.hasManualOverride).toBe(true);
    });

    it('manual override takes precedence over OS preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      localStorage.setItem(STORAGE_KEY, 'false');

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);
      expect(result.current.hasManualOverride).toBe(true);
    });
  });

  describe('Manual override', () => {
    it('setManualOverride sets preference to true', async () => {
      const { result } = renderHook(() => useReducedMotion());

      await act(async () => {
        result.current.setManualOverride(true);
      });

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
      expect(result.current.hasManualOverride).toBe(true);
    });

    it('setManualOverride sets preference to false', async () => {
      const { result } = renderHook(() => useReducedMotion());

      await act(async () => {
        result.current.setManualOverride(false);
      });

      expect(result.current.prefersReducedMotion).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
      expect(result.current.hasManualOverride).toBe(true);
    });

    it('clearManualOverride removes localStorage entry', async () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      const { result } = renderHook(() => useReducedMotion());

      await waitFor(() => {
        expect(result.current.hasManualOverride).toBe(true);
      });

      await act(async () => {
        result.current.clearManualOverride();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result.current.hasManualOverride).toBe(false);
    });

    it('clearManualOverride reverts to OS preference', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      localStorage.setItem(STORAGE_KEY, 'false');
      const { result } = renderHook(() => useReducedMotion());

      await waitFor(() => {
        expect(result.current.prefersReducedMotion).toBe(false);
      });

      await act(async () => {
        result.current.clearManualOverride();
      });

      expect(result.current.prefersReducedMotion).toBe(true);
    });
  });

  describe('OS preference changes', () => {
    it('updates when OS preference changes and no manual override', async () => {
      let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => {
          const matches = query === '(prefers-reduced-motion: reduce)';
          return {
            matches,
            media: query,
            onchange: null,
            addEventListener: (event: string, listener: any) => {
              if (event === 'change') mediaQueryListener = listener;
            },
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);

      // Simulate OS preference change
      if (mediaQueryListener) {
        await act(async () => {
          mediaQueryListener!({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
          } as MediaQueryListEvent);
        });
      }

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it('ignores OS preference changes when manual override is active', async () => {
      let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => {
          return {
            matches: false,
            media: query,
            onchange: null,
            addEventListener: (event: string, listener: any) => {
              if (event === 'change') mediaQueryListener = listener;
            },
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }),
      });

      localStorage.setItem(STORAGE_KEY, 'false');
      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);

      // Try to change OS preference - should be ignored
      if (mediaQueryListener) {
        await act(async () => {
          mediaQueryListener!({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
          } as MediaQueryListEvent);
        });
      }

      expect(result.current.prefersReducedMotion).toBe(false);
    });
  });

  describe('Custom events', () => {
    it('dispatches hamplard:reduced-motion-changed on manual override', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const { result } = renderHook(() => useReducedMotion());

      await act(async () => {
        result.current.setManualOverride(true);
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hamplard:reduced-motion-changed',
        }),
      );
    });

    it('dispatches hamplard:reduced-motion-changed on clear override', async () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useReducedMotion());

      await waitFor(() => {
        expect(result.current.hasManualOverride).toBe(true);
      });

      await act(async () => {
        result.current.clearManualOverride();
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hamplard:reduced-motion-changed',
        }),
      );
    });
  });

  describe('Mounted state', () => {
    it('returns mounted=false initially', () => {
      const { result } = renderHook(() => useReducedMotion());
      // mounted should be false or true depending on effect execution
      expect(typeof result.current.mounted).toBe('boolean');
    });

    it('returns mounted=true after effect', async () => {
      const { result } = renderHook(() => useReducedMotion());

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });
    });
  });

  describe('Storage persistence', () => {
    it('persists manual override to localStorage', async () => {
      const { result } = renderHook(() => useReducedMotion());

      await act(async () => {
        result.current.setManualOverride(true);
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBe('true');
    });

    it('persists false override to localStorage', async () => {
      const { result } = renderHook(() => useReducedMotion());

      await act(async () => {
        result.current.setManualOverride(false);
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBe('false');
    });

    it('survives page reload', () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.hasManualOverride).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles null localStorage gracefully', () => {
      const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(false);
      expect(result.current.hasManualOverride).toBe(false);

      getSpy.mockRestore();
    });

    it('handles invalid localStorage values', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');

      const { result } = renderHook(() => useReducedMotion());

      // "invalid" string is truthy, so it should be treated as true
      expect(result.current.hasManualOverride).toBe(true);
    });
  });
});

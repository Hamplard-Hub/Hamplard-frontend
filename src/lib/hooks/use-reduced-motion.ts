import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hamplard_reduced_motion';

/**
 * Hook to detect and manage reduced motion preferences
 *
 * Respects:
 * 1. User OS preference (prefers-reduced-motion: reduce)
 * 2. Local storage override (manual toggle in settings)
 *
 * Returns:
 * - `prefersReducedMotion`: boolean indicating if animations should be disabled
 * - `setManualOverride`: function to toggle the manual override (stores in localStorage)
 * - `hasManualOverride`: boolean indicating if user has manually set a preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasManualOverride, setHasManualOverride] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Detect OS preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const osPreference = mediaQuery.matches;

    // Check for manual override in localStorage
    const storedPreference = localStorage.getItem(STORAGE_KEY);
    const hasOverride = storedPreference !== null;
    const manualPreference = storedPreference === 'true';

    // Determine final preference: manual override takes precedence
    const finalPreference = hasOverride ? manualPreference : osPreference;

    setPrefersReducedMotion(finalPreference);
    setHasManualOverride(hasOverride);
    setMounted(true);

    // Listen for OS preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if there's no manual override
      if (!hasOverride) {
        setPrefersReducedMotion(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setManualOverride = (enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    setPrefersReducedMotion(enabled);
    setHasManualOverride(true);

    // Dispatch custom event so other parts of the app can react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hamplard:reduced-motion-changed', {
          detail: { prefersReducedMotion: enabled },
        }),
      );
    }
  };

  const clearManualOverride = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasManualOverride(false);

    // Revert to OS preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hamplard:reduced-motion-changed', {
          detail: { prefersReducedMotion: mediaQuery.matches },
        }),
      );
    }
  };

  return {
    prefersReducedMotion,
    setManualOverride,
    clearManualOverride,
    hasManualOverride,
    mounted,
  };
}

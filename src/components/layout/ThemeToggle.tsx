'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'theme-preference';
const MANUAL_PREFERENCE_KEY = 'theme-preference-manual';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [hasManualPreference, setHasManualPreference] = useState(false);

  useEffect(() => {
    let hasManualPreference = false;
    let savedTheme: string | null = null;
    try {
      hasManualPreference = localStorage.getItem(MANUAL_PREFERENCE_KEY) === 'true';
      savedTheme = localStorage.getItem(STORAGE_KEY);
    } catch { /* noop */ }

    if (hasManualPreference && (savedTheme === 'light' || savedTheme === 'dark')) {
      setHasManualPreference(true);
      setTheme(savedTheme);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (hasManualPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasManualPreference]);

  useEffect(() => {
    if (theme === null) return;

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      localStorage.setItem(MANUAL_PREFERENCE_KEY, 'true');
    } catch { /* noop */ }
    setHasManualPreference(true);
    setTheme(nextTheme);
  };

  if (theme === null) {
    // Avoid hydration mismatch by not rendering until theme is set
    return null;
  }

  return (
    <button
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-current transition-colors hover:bg-hamplard-lilac dark:hover:bg-ink-700"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
}

export default ThemeToggle;

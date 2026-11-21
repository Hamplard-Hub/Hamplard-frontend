'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { locales, localeLabels, defaultLocale, type Locale } from '@/i18n/config';

const LOCALE_KEY = 'hamplard-locale';

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (stored && locales.includes(stored)) return stored;
  } catch {}
  return defaultLocale;
}

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (l: Locale) => {
    setLocale(l);
    setOpen(false);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {}
    // Update the <html lang> attribute
    document.documentElement.lang = l;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeLabels[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg dark:border-ink-700 dark:bg-ink-900">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleSelect(l)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 ${
                l === locale
                  ? 'font-semibold text-hamplard-primary'
                  : 'text-ink-700 dark:text-ink-300'
              }`}
            >
              {localeLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

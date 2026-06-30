'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Settings2, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

type ConsentRecord = {
  acceptedAt: number;
  preferences: CookiePreferences;
  version: string;
};

const STORAGE_KEY = 'hamplard-cookie-consent';
const CONSENT_VERSION = 'v1';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readStoredConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ConsentRecord;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(preferences: CookiePreferences) {
  if (typeof window === 'undefined') return;

  const record: ConsentRecord = {
    acceptedAt: Date.now(),
    preferences,
    version: CONSENT_VERSION,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const toast = useToast();

  useEffect(() => {
    const stored = readStoredConsent();
    if (!stored) {
      setIsVisible(true);
      return;
    }

    setPreferences(stored.preferences);
  }, []);

  const savePreferences = (
    nextPreferences: CookiePreferences,
    toastTitle = 'Cookie preferences saved',
    toastDescription = 'Your cookie choices have been updated for Hamplard.',
  ) => {
    writeConsent(nextPreferences);
    setPreferences(nextPreferences);
    setIsVisible(false);
    setIsModalOpen(false);
    toast.success({
      title: toastTitle,
      description: toastDescription,
    });
  };

  const handleAcceptAll = () => {
    const nextPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    savePreferences(nextPreferences, 'All cookies accepted', 'You are now opted in to analytics and marketing cookies.');
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 z-[60] w-full border-t border-[#D5D2F6] bg-[#26215C] px-4 py-4 text-white shadow-[0_-12px_40px_rgba(38,33,92,0.16)] sm:px-6 lg:px-8"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-white/10 p-2">
              <ShieldCheck className="h-5 w-5 text-[#EEEDFE]" aria-hidden="true" />
            </div>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold leading-6">
                We use cookies to improve your experience. See our{' '}
                <Link href="/privacy" className="underline decoration-[#7F77DD] underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE]"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Manage Preferences
            </button>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0F0D2E]/70 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="w-full max-w-xl rounded-[28px] border border-[#D5D2F6] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">Cookie settings</p>
                <h2 id="cookie-preferences-title" className="mt-2 text-2xl font-semibold text-[#26215C]">
                  Manage your consent preferences
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close cookie preferences"
                className="rounded-full p-2 text-[#5A5578] transition hover:bg-[#F4F2FF]"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#5A5578]">
              Choose which categories of cookies you allow. Necessary cookies are required for secure site operation and cannot be turned off.
            </p>

            <div className="mt-6 space-y-3">
              {([
                { key: 'necessary' as const, title: 'Necessary', description: 'Required for authentication, security, and essential site functionality.' },
                { key: 'analytics' as const, title: 'Analytics', description: 'Help us understand how visitors use the platform to improve the experience.' },
                { key: 'marketing' as const, title: 'Marketing', description: 'Allow us to show relevant offers and updates across the platform.' },
              ]).map((option) => {
                const checked = preferences[option.key];
                const isDisabled = option.key === 'necessary';

                return (
                  <label
                    key={option.key}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-[#D5D2F6] bg-[#FAF9FF] p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#26215C]">{option.title}</span>
                        {option.key === 'necessary' ? (
                          <span className="rounded-full bg-[#E7E4FF] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]">
                            Required
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#5A5578]">{option.description}</p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        setPreferences((current) => ({ ...current, [option.key]: !current[option.key] }));
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? 'bg-[#26215C]' : 'bg-[#CFCBFF]'} ${isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </label>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-[#D5D2F6] px-4 py-2 text-sm font-semibold text-[#5A5578] transition hover:bg-[#F4F2FF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => savePreferences(preferences)}
                className="inline-flex items-center gap-2 rounded-full bg-[#26215C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

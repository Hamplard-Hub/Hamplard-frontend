'use client';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { createQueryClient } from '@/lib/query-client';
import {
  flushPendingProgress,
  listenForServiceWorkerMessages,
  registerOfflineServiceWorker,
  requestBackgroundSync,
} from '@/lib/offline';

const THEME_STORAGE_KEY = 'theme-preference';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const rehydrate = useAuthStore((s) => s.rehydrate);

  useEffect(() => { rehydrate(); }, [rehydrate]);

  // ── Offline lesson downloads (Issue #411) ────────────────────────────────
  // Registers the service worker and delivers any progress that was queued
  // while the device was offline.
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    let registration: ServiceWorkerRegistration | null = null;

    const flush = () => {
      flushPendingProgress().catch(() => undefined);
    };

    const handleOnline = () => {
      flush();
      void requestBackgroundSync(registration);
    };

    const setup = async () => {
      registration = await registerOfflineServiceWorker();
      if (cancelled) return;

      // Anything left over from a previous offline session goes out now.
      if (typeof navigator !== 'undefined' && navigator.onLine) flush();

      unlisten = listenForServiceWorkerMessages(flush);
      window.addEventListener('online', handleOnline);
    };

    void setup();

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      unlisten?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NetworkStatusBanner />
        {children}
        <CookieConsentBanner />
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

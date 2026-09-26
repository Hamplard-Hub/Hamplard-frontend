'use client';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { createQueryClient } from '@/lib/query-client';

const THEME_STORAGE_KEY = 'theme-preference';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const rehydrate = useAuthStore((s) => s.rehydrate);

  useEffect(() => { rehydrate(); }, [rehydrate]);

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

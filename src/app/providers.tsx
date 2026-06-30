'use client';
import { useEffect } from 'react';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const rehydrate = useAuthStore((s) => s.rehydrate);
  useEffect(() => { rehydrate(); }, [rehydrate]);

  return (
    <ToastProvider>
      {children}
      <CookieConsentBanner />
    </ToastProvider>
  );
}

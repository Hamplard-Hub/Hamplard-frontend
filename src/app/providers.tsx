'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const rehydrate = useAuthStore((s) => s.rehydrate);
  useEffect(() => { rehydrate(); }, [rehydrate]);
  return <>{children}</>;
}

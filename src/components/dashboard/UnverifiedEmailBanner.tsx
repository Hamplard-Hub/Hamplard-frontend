'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MailWarning, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { authApi } from '@/lib/api/services';

export function UnverifiedEmailBanner() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!user?.email || cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      await authApi.resendVerificationEmail({ email: user.email });
    } finally {
      setSent(true);
      setCooldown(60);
      setIsSending(false);
    }
  }, [user?.email, cooldown, isSending]);

  if (!user || user.isVerified || dismissed) return null;

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-800">
      <MailWarning className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        Your email address is not verified.{' '}
        <Link href="/verify-email" className="underline hover:text-amber-900">
          Verify now
        </Link>{' '}
        or{' '}
        {sent ? (
          <span className="font-medium">
            {cooldown > 0 ? `resend available in ${cooldown}s` : 'email sent — check your inbox'}
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isSending}
            className="underline hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            {isSending && <Loader2 className="w-3 h-3 animate-spin" />}
            {cooldown > 0 ? `resend in ${cooldown}s` : 'resend verification email'}
          </button>
        )}
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 hover:bg-amber-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Mail, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/services';

type VerifyState = 'loading' | 'success' | 'expired' | 'invalid';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>('loading');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    authApi.verifyEmail({ token })
      .then(() => setState('success'))
      .catch((error: any) => {
        const status = error?.response?.status;
        const message: string = error?.response?.data?.message ?? '';
        if (status === 410 || /expired/i.test(message)) {
          setState('expired');
        } else {
          setState('invalid');
        }
      });
  }, [token]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (!resendEmail || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authApi.resendVerificationEmail({ email: resendEmail });
      setResendSent(true);
      setResendCooldown(60);
    } catch {
      // show generic message
      setResendSent(true);
      setResendCooldown(60);
    } finally {
      setIsResending(false);
    }
  }, [resendEmail, resendCooldown, isResending]);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#EEEDFE] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10">
        <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
          Hamplard
        </Link>
        {children}
      </div>
    </div>
  );

  if (state === 'loading') {
    return shell(
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader2 className="w-10 h-10 text-[#7F77DD] animate-spin" />
        <p className="text-sm text-[#554F99]">Verifying your email…</p>
      </div>,
    );
  }

  if (state === 'success') {
    return shell(
      <>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#26215C] text-center">Email verified!</h1>
        <p className="mb-6 text-sm text-[#554F99] text-center">
          Your email address has been confirmed. You can now access all features.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
        >
          Go to dashboard
        </Link>
      </>,
    );
  }

  if (state === 'expired') {
    return shell(
      <>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#26215C] text-center">Link expired</h1>
        <p className="mb-6 text-sm text-[#554F99] text-center">
          This verification link has expired. Enter your email below to receive a new one.
        </p>
        {resendSent ? (
          <div className="rounded-xl bg-[#EEEDFE] px-4 py-3 text-center text-sm text-[#26215C]">
            <Mail className="inline w-4 h-4 mr-1" />
            Check your inbox — a new link is on its way.
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Your email address"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#26215C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F77DD]"
            />
            <button
              onClick={handleResend}
              disabled={!resendEmail || resendCooldown > 0 || isResending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending && <Loader2 className="w-4 h-4 animate-spin" />}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
            </button>
          </div>
        )}
        <Link href="/login" className="mt-4 block text-center text-sm text-[#7F77DD] hover:underline">
          Back to login
        </Link>
      </>,
    );
  }

  // invalid
  return shell(
    <>
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-[#26215C] text-center">Invalid link</h1>
      <p className="mb-6 text-sm text-[#554F99] text-center">
        This verification link is invalid or has already been used.
      </p>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
      >
        Back to login
      </Link>
    </>,
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EEEDFE] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#7F77DD] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

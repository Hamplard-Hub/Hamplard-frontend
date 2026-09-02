'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gift, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { giftsApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { useToast } from '@/lib/hooks/use-toast';
import type { Gift as GiftType } from '@/types';

type PageState = 'loading' | 'ready' | 'claiming' | 'claimed' | 'error';

export default function GiftClaimPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const toast = useToast();
  const { isConnected } = useAuthStore();

  const [state, setState] = useState<PageState>('loading');
  const [gift, setGift] = useState<GiftType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    giftsApi
      .getByToken(token)
      .then((g) => {
        setGift(g);
        if (g.status === 'CLAIMED') {
          setState('claimed');
        } else if (g.status === 'EXPIRED') {
          setErrorMsg('This gift link has expired.');
          setState('error');
        } else {
          setState('ready');
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : 'Gift not found.');
        setState('error');
      });
  }, [token]);

  const handleClaim = async () => {
    if (!isConnected) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/gift/claim/${token}`)}`);
      return;
    }
    setState('claiming');
    try {
      await giftsApi.claim(token);
      setState('claimed');
      toast.success({
        title: 'Course claimed!',
        description: 'The gifted course has been added to your dashboard.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to claim gift.';
      setErrorMsg(message);
      setState('error');
      toast.error({ title: 'Claim failed', description: message });
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 className="h-6 w-6 animate-spin text-saffron-500" aria-label="Loading gift…" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
          <h1 className="mb-2 font-display text-2xl font-bold text-ink-900">
            Gift unavailable
          </h1>
          <p className="mb-6 text-sm text-ink-500">{errorMsg}</p>
          <Link href="/courses" className="btn-primary inline-flex px-6 py-3">
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  // ── Already claimed ────────────────────────────────────────────────────
  if (state === 'claimed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-leaf-600" aria-hidden="true" />
          <h1 className="mb-2 font-display text-2xl font-bold text-ink-900">
            Gift already claimed
          </h1>
          <p className="mb-6 text-sm text-ink-500">
            This gift has already been claimed. Head to your dashboard to start learning.
          </p>
          <Link href="/dashboard/my-courses" className="btn-primary inline-flex px-6 py-3">
            Go to my courses
          </Link>
        </div>
      </div>
    );
  }

  // ── Ready to claim ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ink-50 px-4 py-16">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50">
            <Gift className="h-8 w-8 text-saffron-600" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900">You have a gift!</h1>
          <p className="mt-2 text-sm text-ink-500">
            Someone gifted you a course on Hamplard. Claim it to start learning for free.
          </p>
        </div>

        {/* Gift details card */}
        <div className="card p-6 space-y-4">
          {gift?.course && (
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-saffron-100 to-saffron-200">
                {gift.course.thumbnailUrl ? (
                  <img
                    src={gift.course.thumbnailUrl}
                    alt={gift.course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🎓</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{gift.course.title}</p>
                <p className="text-xs text-ink-500">
                  by {gift.course.instructor?.name ?? 'Hamplard Instructor'}
                </p>
              </div>
            </div>
          )}

          {gift?.message && (
            <blockquote className="rounded-xl border-l-4 border-saffron-300 bg-saffron-50 py-3 pl-4 pr-3 text-sm italic text-ink-700">
              "{gift.message}"
            </blockquote>
          )}

          <button
            type="button"
            disabled={state === 'claiming'}
            onClick={handleClaim}
            className="btn-primary w-full"
            aria-busy={state === 'claiming'}
          >
            {state === 'claiming' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Claiming…
              </>
            ) : isConnected ? (
              <>
                <Gift className="h-4 w-4" aria-hidden="true" />
                Claim my course
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" aria-hidden="true" />
                Sign in to claim
              </>
            )}
          </button>

          {!isConnected && (
            <p className="text-center text-xs text-ink-400">
              You'll be asked to sign in or create a free account first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

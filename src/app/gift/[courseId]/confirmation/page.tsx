'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, Check, Download, Share2, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const recipient = searchParams.get('recipient') ?? 'your recipient';

  const claimUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gift/claim/${token}`
      : `/gift/claim/${token}`;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'You have a course gift!',
          text: `I'm gifting you a course on Hamplard. Click the link to claim it.`,
          url: claimUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadCard = () => {
    // Build a simple text-based gift card and trigger download
    const content = [
      '╔══════════════════════════════════════╗',
      '║           🎁  HAMPLARD GIFT           ║',
      '╠══════════════════════════════════════╣',
      `║  To: ${recipient.padEnd(34)}║`,
      '║                                      ║',
      '║  You have received a course gift!    ║',
      '║  Use the link below to claim it:     ║',
      '║                                      ║',
      `║  ${claimUrl.slice(0, 38).padEnd(38)}║`,
      claimUrl.length > 38 ? `║  ${claimUrl.slice(38, 76).padEnd(38)}║` : null,
      '║                                      ║',
      '║         hamplard.com                 ║',
      '╚══════════════════════════════════════╝',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hamplard-gift-card.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-16">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Success header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-50">
            <CheckCircle2 className="h-8 w-8 text-leaf-600" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Gift sent!</h1>
          <p className="mt-2 text-sm text-ink-500">
            A gift link has been prepared for{' '}
            <span className="font-medium text-ink-800">{recipient}</span>. Share it with them or
            let the scheduled email deliver it.
          </p>
        </div>

        {/* Shareable gift link card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Gift className="h-4 w-4 text-saffron-600" aria-hidden="true" />
            Gift claim link
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-600">
              {claimUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                'shrink-0 rounded-lg p-1.5 transition-colors',
                copied
                  ? 'bg-leaf-50 text-leaf-600'
                  : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700',
              )}
              aria-label={copied ? 'Copied!' : 'Copy gift link'}
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="btn-primary flex-1 text-sm"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share link
            </button>
            <button
              type="button"
              onClick={handleDownloadCard}
              className="btn-secondary flex-1 text-sm"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download gift card
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">What happens next?</h2>
          <ul className="space-y-1.5 text-sm text-ink-500">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-saffron-500">1.</span>
              The recipient visits the gift link above.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-saffron-500">2.</span>
              They sign in or create a free Hamplard account.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-saffron-500">3.</span>
              The course is added to their enrolled courses instantly.
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/courses" className="btn-secondary text-sm">
            Browse more courses
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GiftConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

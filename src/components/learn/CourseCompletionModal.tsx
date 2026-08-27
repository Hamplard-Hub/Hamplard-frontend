'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, X } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

type CourseCompletionModalProps = {
  open: boolean;
  courseTitle: string;
  courseId: string;
  onClose: () => void;
};

export default function CourseCompletionModal({
  open,
  courseTitle,
  courseId,
  onClose,
}: CourseCompletionModalProps) {
  const [isVisible, setIsVisible] = useState(open);
  const { prefersReducedMotion, mounted } = useReducedMotion();

  useEffect(() => {
    setIsVisible(open);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted || prefersReducedMotion) return;

    let cancelled = false;

    const triggerConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default;
      if (cancelled) return;

      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        ticks: 200,
        colors: ['#f59e0b', '#10b981', '#0f172a'],
      });
    };

    void triggerConfetti();

    return () => {
      cancelled = true;
    };
  }, [open, mounted, prefersReducedMotion]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!isVisible) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareToPlatform = (platform: 'linkedin' | 'twitter') => {
    const encodedUrl = encodeURIComponent(shareUrl || `https://hamplard.app/courses/${courseId}`);
    const shareUrlMap = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just completed ${courseTitle} on Hamplard!`)}&url=${encodedUrl}`,
    };

    window.open(shareUrlMap[platform], '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    const urlToCopy = shareUrl || `https://hamplard.app/courses/${courseId}`;
    try {
      await navigator.clipboard.writeText(urlToCopy);
    } catch {
      window.prompt('Copy this link', urlToCopy);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 px-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close celebration modal"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-completion-title"
        className="relative w-full max-w-lg rounded-3xl border border-saffron-100 bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mb-4 text-5xl">🎉</div>
          <h2 id="course-completion-title" className="font-display text-2xl font-semibold text-ink-900">
            Congratulations!
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            You completed <span className="font-semibold text-ink-700">{courseTitle}</span>.
          </p>

          <div className="mt-6 rounded-2xl border border-saffron-100 bg-gradient-to-br from-saffron-50 to-leaf-50 p-5">
            <p className="text-sm text-ink-600">
              Your certificate is ready and your achievement is worth celebrating.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/certificates"
                onClick={onClose}
                className="btn-primary inline-flex"
              >
                View certificate
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink-600">Share your milestone</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => shareToPlatform('linkedin')}
                className="rounded-full border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-saffron-300 hover:text-saffron-700"
              >
                LinkedIn
              </button>
              <button
                type="button"
                onClick={() => shareToPlatform('twitter')}
                className="rounded-full border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-saffron-300 hover:text-saffron-700"
              >
                Twitter
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-saffron-300 hover:text-saffron-700"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

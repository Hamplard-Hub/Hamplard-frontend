'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, ArrowRight, BookOpen, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore, type CartItem } from '@/lib/hooks/use-cart-store';
import { formatUsdc } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ConfirmationStepProps {
  receipt: {
    items: CartItem[];
    total: number;
    transactionId: string;
  };
}

export function ConfirmationStep({ receipt }: ConfirmationStepProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    // Simulate receipt generation/download
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setDownloading(false);
  };

  return (
    <section className="mx-auto max-w-2xl">
      {/* Success card */}
      <div
        className={cn(
          'rounded-2xl border border-leaf-500/30 bg-white p-8 text-center shadow-card transition-all duration-500 sm:p-12',
          showAnimation
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0',
        )}
      >
        {/* Animated checkmark */}
        <div
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 transition-all duration-500 delay-200',
            showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
        >
          <CheckCircle2 className="h-10 w-10 text-leaf-600" aria-hidden="true" />
        </div>

        <h1
          className={cn(
            'mt-5 text-2xl font-semibold text-ink-900 transition-all duration-500 delay-300 sm:text-3xl',
            showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          Payment received!
        </h1>

        <p
          className={cn(
            'mt-2 text-ink-600 transition-all duration-500 delay-400',
            showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          We&apos;ve charged <strong className="text-hamplard-primary">{formatUsdc(receipt.total)}</strong>.
          You now have access to {receipt.items.length} course{receipt.items.length === 1 ? '' : 's'}.
        </p>

        {/* Transaction ID */}
        <p
          className={cn(
            'mt-2 text-xs text-ink-400 font-mono transition-all duration-500 delay-500',
            showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          Transaction ID: {receipt.transactionId}
        </p>

        {/* Enrolled courses */}
        <div
          className={cn(
            'mt-8 space-y-3 text-left transition-all duration-500 delay-[600ms]',
            showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <GraduationCap className="h-4 w-4 text-hamplard-primary" />
            Enrolled courses
          </h2>

          {receipt.items.map((item) => (
            <div
              key={item.courseId}
              className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 transition-colors hover:bg-ink-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="h-5 w-5 shrink-0 text-hamplard-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {item.course.title}
                  </p>
                  <p className="text-xs text-ink-500">
                    {item.course.instructor?.name || 'Hamplard Instructor'}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/courses/${item.courseId}`}
                className="shrink-0 text-xs font-medium text-hamplard-primary hover:text-hamplard-primary/80 transition-colors"
              >
                Start learning →
              </Link>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            'mt-8 flex flex-wrap justify-center gap-3 transition-all duration-500 delay-700',
            showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <Link href="/dashboard/courses">
            <Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
              Go to My Courses
            </Button>
          </Link>
          <Button
            variant="tertiary"
            size="lg"
            onClick={handleDownloadReceipt}
            isLoading={downloading}
            loadingText="Generating..."
            icon={<Download className="h-4 w-4" />}
          >
            Download Receipt
          </Button>
        </div>
      </div>

      {/* Recognition badge */}
      <div
        className={cn(
          'mx-auto mt-6 flex items-center justify-center gap-2 rounded-xl border border-saffron-200 bg-saffron-50 px-5 py-3 text-center transition-all duration-500 delay-800',
          showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <Award className="h-5 w-5 text-saffron-600" />
        <p className="text-sm text-saffron-800">
          You&apos;ve earned <strong>{receipt.items.length}</strong> new course certificate
          {receipt.items.length === 1 ? '' : 's'}! Complete each course to claim them.
        </p>
      </div>
    </section>
  );
}

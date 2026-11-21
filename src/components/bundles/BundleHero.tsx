'use client';

import { ShoppingCart, Tag, Clock, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bundle } from '@/types';

interface BundleHeroProps {
  bundle: Bundle;
  /** Total hours across all included courses */
  totalHours: number;
  /** Total lectures across all included courses */
  totalLectures: number;
  /** Number of certificates included */
  certificateCount: number;
  onAddAllToCart: () => void;
  allInCart: boolean;
}

export function BundleHero({
  bundle,
  totalHours,
  totalLectures,
  certificateCount,
  onAddAllToCart,
  allInCart,
}: BundleHeroProps) {
  const savings = bundle.totalValue - bundle.bundlePrice;
  const savingsPct = bundle.totalValue > 0
    ? Math.round((savings / bundle.totalValue) * 100)
    : 0;

  function formatUsdc(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-hamplard-deep via-[#3b3589] to-hamplard-primary text-white shadow-xl">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-saffron-500/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:gap-10">

        {/* ── Left: text content ── */}
        <div className="flex-1 min-w-0">
          {/* Discount badge */}
          {savingsPct > 0 && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-saffron-400/20 px-3 py-1 text-xs font-semibold text-saffron-300 ring-1 ring-saffron-400/30">
              <Tag className="h-3.5 w-3.5" />
              Save {savingsPct}%
            </span>
          )}

          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
            {bundle.title}
          </h1>

          {bundle.description && (
            <p className="mt-3 text-sm leading-relaxed text-white/75 line-clamp-3">
              {bundle.description}
            </p>
          )}

          {/* What you get summary */}
          <div className="mt-5 flex flex-wrap gap-4">
            <StatPill icon={Clock} label={`${totalHours.toFixed(0)}h total`} />
            <StatPill icon={BookOpen} label={`${totalLectures} lectures`} />
            {certificateCount > 0 && (
              <StatPill icon={Award} label={`${certificateCount} certificate${certificateCount > 1 ? 's' : ''}`} />
            )}
          </div>
        </div>

        {/* ── Right: price card ── */}
        <div className="w-full shrink-0 rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-sm lg:w-72">
          {/* Price */}
          <div className="mb-1 flex items-end gap-2">
            <span className="text-3xl font-extrabold">
              {formatUsdc(bundle.bundlePrice)}
              <span className="ml-1 text-sm font-normal text-white/60">USDC</span>
            </span>
          </div>
          {bundle.totalValue > bundle.bundlePrice && (
            <p className="mb-4 text-sm text-white/50">
              <span className="line-through">{formatUsdc(bundle.totalValue)} USDC</span>
              {' '}
              <span className="font-semibold text-saffron-300">
                You save {formatUsdc(savings)} USDC
              </span>
            </p>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={onAddAllToCart}
            disabled={allInCart}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition',
              allInCart
                ? 'cursor-default bg-white/20 text-white/60'
                : 'bg-saffron-500 text-white hover:bg-saffron-400 active:scale-95',
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            {allInCart ? 'All courses in cart' : 'Add all to cart'}
          </button>

          {/* Course count */}
          <p className="mt-3 text-center text-xs text-white/50">
            {bundle.courses.length} course{bundle.courses.length !== 1 ? 's' : ''} included
          </p>
        </div>
      </div>
    </div>
  );
}

// ── tiny helper ───────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}

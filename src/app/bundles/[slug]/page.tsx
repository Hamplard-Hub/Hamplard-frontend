'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BundleHero } from '@/components/bundles/BundleHero';
import { CourseCard } from '@/components/courses/CourseCard';
import { bundlesApi } from '@/lib/api/services';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import type { Bundle, BundleSummary } from '@/types';
import Link from 'next/link';

export default function BundlePage() {
  const { slug } = useParams<{ slug: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    bundlesApi
      .getBySlug(slug)
      .then(setBundle)
      .catch((e) => setError(e?.message ?? 'Failed to load bundle'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="h-2.5 w-2.5 rounded-full bg-hamplard-primary animate-pulse" />
        <span className="ml-3 text-sm text-ink-500">Loading bundle…</span>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-lg font-semibold text-ink-900">Bundle not found</p>
        <p className="mt-1 text-sm text-ink-500">{error ?? 'This bundle may have been removed.'}</p>
        <Link href="/courses" className="btn-primary mt-6 inline-flex">
          Browse courses
        </Link>
      </div>
    );
  }

  /* ── derived values ──────────────────────────────────────────────────── */
  const totalHours = bundle.courses.reduce(
    (acc, c) => acc + ((c as any).totalHours ?? 0),
    0,
  );
  const totalLectures = bundle.courses.reduce(
    (acc, c) => acc + ((c as any).totalLectures ?? 0),
    0,
  );
  const certificateCount = bundle.courses.filter(
    (c) => (c as any).hasCertificate,
  ).length;

  const cartIds = new Set(cartItems.map((i) => i.courseId));
  const allInCart = bundle.courses.length > 0 && bundle.courses.every((c) => cartIds.has(c.id));

  function handleAddAll() {
    bundle!.courses.forEach((course) => {
      if (!cartIds.has(course.id)) {
        addItem(course);
      }
    });
  }

  const savings = bundle.totalValue - bundle.bundlePrice;
  const savingsPct = bundle.totalValue > 0
    ? Math.round((savings / bundle.totalValue) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">

      {/* ── Hero ── */}
      <BundleHero
        bundle={bundle}
        totalHours={totalHours}
        totalLectures={totalLectures}
        certificateCount={certificateCount}
        onAddAllToCart={handleAddAll}
        allInCart={allInCart}
      />

      {/* ── What you get summary strip ── */}
      <section aria-label="Bundle summary">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Courses" value={String(bundle.courses.length)} />
          <SummaryCard label="Total hours" value={`${totalHours.toFixed(0)}h`} />
          <SummaryCard label="Lectures" value={String(totalLectures)} />
          {savingsPct > 0 && (
            <SummaryCard label="You save" value={`${savingsPct}%`} highlight />
          )}
        </div>
      </section>

      {/* ── Included courses ── */}
      <section>
        <h2 className="section-heading mb-5">Included courses</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bundle.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* ── Related bundles ── */}
      {bundle.relatedBundles && bundle.relatedBundles.length > 0 && (
        <section>
          <h2 className="section-heading mb-5">Related bundles</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bundle.relatedBundles.map((b) => (
              <RelatedBundleCard key={b.id} bundle={b} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ── small sub-components ──────────────────────────────────────────────── */

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        highlight
          ? 'border-saffron-200 bg-saffron-50'
          : 'border-ink-100 bg-white'
      }`}
    >
      <p className={`text-2xl font-extrabold ${highlight ? 'text-saffron-600' : 'text-ink-900'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}

function RelatedBundleCard({ bundle }: { bundle: BundleSummary }) {
  const savings = bundle.totalValue - bundle.bundlePrice;
  const savingsPct = bundle.totalValue > 0
    ? Math.round((savings / bundle.totalValue) * 100)
    : 0;

  return (
    <Link
      href={`/bundles/${bundle.slug}`}
      className="group flex gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition hover:border-hamplard-primary hover:shadow-md"
    >
      {bundle.thumbnailUrl && (
        <img
          src={bundle.thumbnailUrl}
          alt=""
          className="h-14 w-14 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-hamplard-primary">
          {bundle.title}
        </p>
        <p className="mt-0.5 text-xs text-ink-400">{bundle.courseCount} courses</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-ink-900">
            {bundle.bundlePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
          </span>
          {savingsPct > 0 && (
            <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-semibold text-saffron-700">
              -{savingsPct}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

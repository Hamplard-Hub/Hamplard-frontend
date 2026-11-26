'use client';

import dynamic from 'next/dynamic';

/**
 * Dynamically imported RevenueChart to reduce initial bundle size.
 * Recharts is a large library (~100KB) that should only load on pages that use charts.
 */
export const RevenueChartDynamic = dynamic(
  () => import('./RevenueChart').then((mod) => ({ default: mod.RevenueChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[300px] bg-ink-50 rounded-lg animate-pulse">
        <p className="text-sm text-ink-500">Loading chart...</p>
      </div>
    ),
    ssr: false, // Charts work best in browser environment
  }
);

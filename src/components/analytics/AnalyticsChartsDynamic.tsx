'use client';

import dynamic from 'next/dynamic';

/**
 * Dynamically imported recharts components to reduce initial bundle size.
 * These components are only loaded when analytics pages are accessed.
 */

// Loading fallback component
const ChartLoader = () => (
  <div className="flex items-center justify-center min-h-[300px] bg-ink-50 rounded-lg animate-pulse">
    <p className="text-sm text-ink-500">Loading chart...</p>
  </div>
);

// Dynamically import recharts components
export const AreaChartDynamic = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { loading: ChartLoader, ssr: false }
);

export const BarChartDynamic = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { loading: ChartLoader, ssr: false }
);

export const LineChartDynamic = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { loading: ChartLoader, ssr: false }
);

// Re-export other recharts components needed
export { Area, Bar, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

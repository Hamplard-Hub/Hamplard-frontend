'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { formatUsdc } from '@/lib/utils';
import { downloadCsv, toCsv } from '@/lib/utils/csv';

interface RevenueData {
  month: string;
  revenue: number;
  date: string;
}

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
  height?: number;
  /** Shown above the chart, e.g. the selected date range */
  rangeLabel?: string;
  /** CSV filename (without extension). Hides the export button when omitted. */
  exportFilename?: string;
}

/**
 * Custom tooltip for the revenue chart showing formatted values
 */
function CustomTooltip(props: TooltipProps<number, string>) {
  const { active, payload } = props;

  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as RevenueData;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-ink-100 p-3">
      <p className="text-sm font-semibold text-ink-900">{data.month}</p>
      <p className="text-base font-bold text-hamplard-primary">
        {formatUsdc(data.revenue)}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for the chart
 */
function ChartSkeleton({ height = 300 }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-end justify-between gap-2 bg-gradient-to-b from-ink-50 to-ink-25 rounded-lg p-4 animate-pulse"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-ink-200 rounded-sm"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  isLoading = false,
  height = 300,
  rangeLabel,
  exportFilename,
}: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Ensure data is sorted by date
    return [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [data]);

  const handleExportCsv = () => {
    if (!exportFilename || chartData.length === 0) return;
    const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const rows = [
      ['Month', 'Period Start', 'Revenue (USDC)'],
      ...chartData.map((d) => [d.month, format(new Date(d.date), 'yyyy-MM-dd'), d.revenue.toFixed(2)]),
      ['Total', '', total.toFixed(2)],
    ];
    downloadCsv(`${exportFilename}.csv`, toCsv(rows));
  };

  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-lg bg-ink-50 border-2 border-dashed border-ink-200"
      >
        <p className="text-sm text-ink-500">
          No revenue data available for the selected period
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-white p-4">
      {(rangeLabel || exportFilename) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs text-ink-500">{rangeLabel}</p>
          {exportFilename && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-ink-100 text-ink-700 hover:bg-ink-200 transition-colors"
              title="Download revenue data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-default)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-default)' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-default)' }}
            tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(127, 119, 221, 0.05)' }}
          />
          <Bar
            dataKey="revenue"
            fill="var(--color-brand-primary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

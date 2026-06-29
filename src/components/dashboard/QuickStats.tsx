'use client';

import React from 'react';

type Stats = {
  label: string;
  value: string | number;
};

export function QuickStats({ stats = [] }: { stats?: Stats[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="card p-3 text-center">
          <div className="text-sm text-ink-500">{s.label}</div>
          <div className="text-lg font-semibold text-ink-900 mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export default QuickStats;

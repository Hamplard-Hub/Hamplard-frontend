'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  items?: { id: string; title: string; progress: number; href: string }[];
};

export function ContinueLearning({ items = [] }: Props) {
  if (items.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold">Continue learning</h3>
        <p className="text-xs text-ink-500 mt-2">No in-progress courses yet. Start a course to see progress here.</p>
        <Link href="/" className="btn-secondary mt-4 inline-flex">Browse courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <Link key={c.id} href={c.href} className="card p-3 flex items-center gap-3">
          <div className="w-12 h-8 bg-ink-100 rounded-md flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-ink-900">{c.title}</div>
            <div className="w-full h-2 bg-ink-100 rounded mt-2 overflow-hidden">
              <div className="h-2 bg-saffron-500" style={{ width: `${Math.min(100, c.progress)}%` }} />
            </div>
          </div>
          <div className="text-xs text-ink-500">{Math.round(c.progress)}%</div>
        </Link>
      ))}
    </div>
  );
}

export default ContinueLearning;

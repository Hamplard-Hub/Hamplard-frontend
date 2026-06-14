'use client';

import Link from 'next/link';
import { Bell, Wifi } from 'lucide-react';

export function TopBar() {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';
  return (
    <header className="h-14 bg-white border-b border-ink-100 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${
          network === 'mainnet'
            ? 'bg-leaf-50 text-leaf-700'
            : 'bg-saffron-50 text-saffron-700'
        }`}>
          <Wifi className="w-3 h-3" />
          {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </span>
        <Link href="/notifications"
          className="relative p-2 rounded-xl text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </Link>
      </div>
    </header>
  );
}

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, HelpCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Captured Runtime Error Boundary Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E1B4B] px-6 py-12 text-center text-white">
      {/* Hamplard Logo */}
      <Link
        href="/"
        className="font-display text-2xl font-bold tracking-tight text-white mb-8 hover:text-saffron-300 transition-colors"
      >
        Hamplard
      </Link>

      <div className="card max-w-lg w-full bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
        {/* Status Code / Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-saffron-300 mb-3">
          Status Code: 500 {error?.digest ? `(ID: ${error.digest})` : 'Internal Server Error'}
        </div>

        <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight mb-3 text-white">
          Something went wrong
        </h1>

        <p className="text-slate-300 mb-8 text-sm sm:text-base leading-relaxed">
          An unexpected server error occurred while processing your request. Don't worry — our team has been notified. You can try refreshing the page or navigating back home.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-saffron-500 hover:bg-saffron-600 text-ink-900 font-semibold rounded-xl transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Go to homepage
          </Link>

          <Link
            href="/contact"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
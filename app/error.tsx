'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Captured Runtime Error Boundary Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center">
      <h1 className="text-4xl font-extrabold text-[#26215C] sm:text-5xl tracking-tight mb-4">
        Something went wrong
      </h1>
      
      <p className="text-gray-600 max-w-md mx-auto mb-8 text-base sm:text-lg">
        An unexpected runtime exception was encountered while assembling this segment layout view.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs sm:max-w-none">
       <button
          onClick={() => reset()}
          className="w-full sm:w-auto px-6 py-3 bg-[#7F77DD] text-white font-semibold rounded-lg shadow-md hover:bg-[#6b62cb] transition-all focus:outline-none"
        >
          Try Again
        </button>
        
      <Link href="/" className="w-full sm:w-auto">
    <button className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-all">
    Go to Home
     </button>
    </Link>
      </div>
    </div>
  );
}
import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  const popularCategories = ['Software Engineering', 'Data Science', 'Digital Marketing', 'Product Design'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center">
      <div className="w-full max-w-sm mb-8 text-[#7F77DD]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-32 h-32 mx-auto">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774z" />
        </svg>
      </div>

      <h1 className="text-4xl font-extrabold text-[#26215C] sm:text-5xl tracking-tight mb-4">
        Page not found
      </h1>
      
      <p className="text-gray-600 max-w-md mx-auto mb-8 text-base sm:text-lg">
        Sorry, we couldn’t find the page you’re looking for. It might have been moved or deleted entirely.
      </p>

      <div className="mb-10 w-full max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Explore Popular Course Categories
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularCategories.map((category) => (
            <span key={category} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium hover:bg-gray-200 transition cursor-pointer">
              {category}
            </span>
          ))}
        </div>
      </div>

      <Link href="/">
        <button className="px-6 py-3 bg-[#7F77DD] text-white font-semibold rounded-lg shadow-md hover:bg-[#6b62cb] transition-all transform hover:-translate-y-0.5 focus:outline-none">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
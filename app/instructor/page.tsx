'use client';

import React from 'react';

export default function InstructorDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Instructor Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome to the instructor dashboard. Issue #11 tracking UI/UX Design.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Courses</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Earnings</h3>
          <p className="text-3xl font-bold mt-2">$0.00</p>
        </div>
      </div>

      <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
        <p className="text-gray-500">Instructor dashboard design and implementation in progress...</p>
      </div>
    </div>
  );
}

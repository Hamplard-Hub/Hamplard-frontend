'use client';

import React from 'react';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { BottomTabs } from '@/components/layout/BottomTabs';

export default function DashboardHomePage() {
  return (
    <div>
      <StudentDashboard name="Alex" />
      <BottomTabs />
    </div>
  );
}

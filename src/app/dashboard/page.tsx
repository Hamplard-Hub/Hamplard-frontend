'use client';

import React, { Suspense } from 'react';
import DashboardHomePage from './home/page';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardHomePage />
    </Suspense>
  );
}


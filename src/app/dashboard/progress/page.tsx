'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ProgressList from '@/components/dashboard/ProgressList';
import { enrollmentsApi } from '@/lib/api/services';
import type { Enrollment } from '@/types';

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentsApi.getMy(1, 100)
      .then((response) => setEnrollments(response.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-heading">Learning Progress</h1>
        <p className="text-sm text-ink-500 mt-0.5">Track your journey across every enrolled course.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-16" aria-label="Loading progress">
          <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
        </div>
      ) : (
        <ProgressList enrollments={enrollments} />
      )}
    </div>
  );
}

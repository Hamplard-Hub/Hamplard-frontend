'use client';

import { useEffect } from 'react';
import { recordRecentlyViewed } from '@/lib/recently-viewed';

interface Props {
  courseId: string;
}

/**
 * Invisible client component that records a course visit in localStorage.
 * Rendered once on the course detail page; produces no visible output.
 */
export default function RecentlyViewedTracker({ courseId }: Props) {
  useEffect(() => {
    if (courseId) recordRecentlyViewed(courseId);
  }, [courseId]);

  return null;
}

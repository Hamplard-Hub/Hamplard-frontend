'use client';

import { useEffect, useMemo, useState } from 'react';
import { coursesApi } from '@/lib/api/services';
import { CourseCarousel } from './CourseCarousel';
import type { Course } from '@/types';

// Pull one reasonably large pool once, then derive each carousel client-side —
// mirrors the pattern already used in src/app/courses/page.tsx, since the
// /courses endpoint doesn't support a `type=featured|bestseller|...` filter yet.
const POOL_LIMIT = 24;
const CARD_LIMIT = 12;

export function HomepageCarousels() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    coursesApi
      .list({ limit: POOL_LIMIT })
      .then((res) => {
        if (!cancelled) setCourses(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { featured, bestsellers, recentlyAdded, free } = useMemo(() => {
    const featured = courses
      .filter((c) => c.badge === 'hot' || (c.rating ?? 0) >= 4.5)
      .slice(0, CARD_LIMIT);

    const bestsellers = [...courses]
      .sort((a, b) => (b.totalEnrollments ?? 0) - (a.totalEnrollments ?? 0))
      .slice(0, CARD_LIMIT);

    const recentlyAdded = [...courses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, CARD_LIMIT);

    const free = courses.filter((c) => Number(c.price) === 0).slice(0, CARD_LIMIT);

    return { featured, bestsellers, recentlyAdded, free };
  }, [courses]);

  return (
    <div className="space-y-14">
      <CourseCarousel
        title="Featured courses"
        subtitle="Hand-picked and top-rated, chosen by our team"
        seeAllHref="/courses?sort=rated"
        courses={featured}
        loading={loading}
        emptyMessage="No featured courses yet — check back soon."
        autoplay
      />

      <CourseCarousel
        title="Bestsellers"
        subtitle="What learners are enrolling in most"
        seeAllHref="/courses?sort=popular"
        courses={bestsellers}
        loading={loading}
        emptyMessage="No bestsellers yet — check back soon."
        autoplay
      />

      <CourseCarousel
        title="Recently added"
        subtitle="Fresh off the press from our instructors"
        seeAllHref="/courses?sort=newest"
        courses={recentlyAdded}
        loading={loading}
        emptyMessage="No new courses yet — check back soon."
        autoplay
      />

      <CourseCarousel
        title="Free courses"
        subtitle="Start learning today, no cost attached"
        seeAllHref="/courses?price=free"
        courses={free}
        loading={loading}
        emptyMessage="No free courses available right now."
        autoplay
      />
    </div>
  );
}
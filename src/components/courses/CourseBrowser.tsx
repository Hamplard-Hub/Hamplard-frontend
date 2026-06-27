'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCardGrid } from './CourseCardGrid';
import type { Course, Category } from '@/types';

interface Props {
  showFilters?: boolean;
}

export function CourseBrowser({ showFilters = true }: Props) {
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [level,      setLevel]      = useState('');

  useEffect(() => {
    coursesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    coursesApi.list({ search: search || undefined, category: category || undefined, level: level || undefined })
      .then((r) => setCourses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, level]);

  return (
    <div>
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="select w-auto">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="select w-auto">
            <option value="">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      )}

      {loading ? (
        <CourseCardGrid courses={[]} loading />
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-ink-400">
          <p className="text-sm">No courses found. Try a different search.</p>
        </div>
      ) : (
        <CourseCardGrid courses={courses} />
      )}
    </div>
  );
}

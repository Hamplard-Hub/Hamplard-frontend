'use client';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/services';
import type { PaginatedResponse, Course } from '@/types';

interface UseCoursesOptions {
  category?: string;
  level?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch courses list with React Query caching
 * Stale time: 2 minutes
 */
export const useCourses = (options?: UseCoursesOptions) => {
  return useQuery({
    queryKey: ['courses', options],
    queryFn: () => coursesApi.list(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch course categories with React Query caching
 * Stale time: 10 minutes
 */
export const useCourseCategories = () => {
  return useQuery({
    queryKey: ['courses', 'categories'],
    queryFn: () => coursesApi.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to fetch pending courses (admin)
 * Stale time: 1 minute
 */
export const usePendingCourses = () => {
  return useQuery({
    queryKey: ['courses', 'pending'],
    queryFn: () => coursesApi.getPending(),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

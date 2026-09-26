'use client';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, enrollmentsApi } from '@/lib/api/services';
import type { Course } from '@/types';

/**
 * Hook to fetch individual course details with React Query caching
 * Stale time: 5 minutes
 * @param id - Course ID (must be defined for query to run)
 */
export const useCourseDetail = (id?: string) => {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.get(id!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    enabled: !!id, // only run query if id is provided
  });
};

/**
 * Hook to check if user is enrolled in a course
 * Stale time: 1 minute (enrollment status can change)
 */
export const useEnrollmentStatus = (courseId?: string) => {
  return useQuery({
    queryKey: ['enrollments', courseId, 'status'],
    queryFn: () => enrollmentsApi.isEnrolled(courseId!),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!courseId,
  });
};

'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi, usersApi } from '@/lib/api/services';

/**
 * Hook to fetch user's enrollments
 * Stale time: 2 minutes
 */
export const useMyEnrollments = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['enrollments', 'my', page, limit],
    queryFn: () => enrollmentsApi.getMy(page, limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch current user profile
 * Stale time: 5 minutes
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook to fetch instructor statistics
 * Stale time: 2 minutes (frequently changes)
 */
export const useInstructorStats = () => {
  return useQuery({
    queryKey: ['users', 'me', 'instructor-stats'],
    queryFn: () => usersApi.getInstructorStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Mutation hook for updating user profile
 * Invalidates current user cache on success
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name?: string; email?: string; bio?: string }) =>
      usersApi.updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
};

/**
 * Mutation hook for creating enrollments
 * Invalidates enrollments and course lists on success
 */
export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      courseId: string;
      txHash: string;
      amountPaid: number;
    }) => enrollmentsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses', data.courseId] });
    },
  });
};

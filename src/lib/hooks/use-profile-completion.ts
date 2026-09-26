import { useMemo } from 'react';
import type { User, UserRole } from '@/types';

export interface CompletionItem {
  key: 'avatar' | 'name' | 'email' | 'bio' | 'payout';
  label: string;
  href: string;
  completed: boolean;
}

interface ProfileCompletionResult {
  percentage: number;
  items: CompletionItem[];
  isComplete: boolean;
  completedCount: number;
  totalCount: number;
}

/**
 * Calculates profile completion percentage and returns checklist items.
 * For students: Avatar, Name, Email, Bio (4 items = 100%)
 * For instructors: Avatar, Name, Email, Bio, Payout method (5 items = 100%)
 */
export function useProfileCompletion(user: User | null, role: UserRole = 'STUDENT'): ProfileCompletionResult {
  return useMemo(() => {
    if (!user) {
      return {
        percentage: 0,
        items: [],
        isComplete: false,
        completedCount: 0,
        totalCount: 0,
      };
    }

    const isInstructor = role === 'INSTRUCTOR' || role === 'ADMIN';

    // Define completion items based on role
    const items: CompletionItem[] = [
      {
        key: 'avatar',
        label: 'Profile photo',
        href: '/dashboard/profile',
        completed: !!user.avatarUrl,
      },
      {
        key: 'name',
        label: 'Full name',
        href: '/dashboard/profile',
        completed: !!user.name && user.name.trim().length > 0,
      },
      {
        key: 'email',
        label: 'Email address',
        href: '/dashboard/profile',
        completed: !!user.email && user.email.trim().length > 0,
      },
      {
        key: 'bio',
        label: 'Bio',
        href: '/dashboard/profile',
        completed: !!user.bio && user.bio.trim().length > 0,
      },
    ];

    // Add payout method for instructors
    if (isInstructor) {
      items.push({
        key: 'payout',
        label: 'Payout method',
        href: '/dashboard/settings',
        completed: false, // TODO: Update based on actual payout method data once available
      });
    }

    const completedCount = items.filter((item) => item.completed).length;
    const totalCount = items.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isComplete = percentage === 100;

    return {
      percentage,
      items,
      isComplete,
      completedCount,
      totalCount,
    };
  }, [user, role]);
}

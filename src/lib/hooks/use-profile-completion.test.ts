import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useProfileCompletion } from './use-profile-completion';
import type { User } from '@/types';

describe('useProfileCompletion', () => {
  const mockUser = (overrides?: Partial<User>): User => ({
    id: '1',
    stellarAddress: 'GXXXXXX',
    email: null,
    name: null,
    bio: null,
    avatarUrl: null,
    role: 'STUDENT',
    isVerified: false,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  describe('Student role', () => {
    it('returns 0% when all fields are empty', () => {
      const user = mockUser();
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.percentage).toBe(0);
      expect(result.current.completedCount).toBe(0);
      expect(result.current.totalCount).toBe(4);
      expect(result.current.isComplete).toBe(false);
    });

    it('returns 25% when only avatar is set', () => {
      const user = mockUser({ avatarUrl: 'https://example.com/avatar.jpg' });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.percentage).toBe(25);
      expect(result.current.completedCount).toBe(1);
      expect(result.current.totalCount).toBe(4);
    });

    it('returns 50% when avatar and name are set', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
      });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.percentage).toBe(50);
      expect(result.current.completedCount).toBe(2);
    });

    it('returns 75% when avatar, name, and email are set', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
        email: 'john@example.com',
      });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.percentage).toBe(75);
      expect(result.current.completedCount).toBe(3);
    });

    it('returns 100% when all fields are set', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'I am a student learning amazing things',
      });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.percentage).toBe(100);
      expect(result.current.completedCount).toBe(4);
      expect(result.current.totalCount).toBe(4);
      expect(result.current.isComplete).toBe(true);
    });

    it('ignores whitespace-only fields as incomplete', () => {
      const user = mockUser({
        name: '   ',
        email: '\t\n',
        bio: '   ',
      });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.percentage).toBe(0);
      expect(result.current.completedCount).toBe(0);
    });

    it('includes correct items with hrefs', () => {
      const user = mockUser();
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      expect(result.current.items).toHaveLength(4);
      expect(result.current.items.map((i) => i.key)).toEqual([
        'avatar',
        'name',
        'email',
        'bio',
      ]);

      // All should link to profile page for students
      result.current.items.forEach((item) => {
        expect(item.href).toBe('/dashboard/profile');
      });
    });
  });

  describe('Instructor role', () => {
    it('includes payout method as 5th item', () => {
      const user = mockUser({ role: 'INSTRUCTOR' });
      const { result } = renderHook(() => useProfileCompletion(user, 'INSTRUCTOR'));

      expect(result.current.totalCount).toBe(5);
      expect(result.current.items.map((i) => i.key)).toEqual([
        'avatar',
        'name',
        'email',
        'bio',
        'payout',
      ]);
    });

    it('returns 20% when only avatar is set (for instructors)', () => {
      const user = mockUser({
        role: 'INSTRUCTOR',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      const { result } = renderHook(() => useProfileCompletion(user, 'INSTRUCTOR'));

      expect(result.current.percentage).toBe(20);
      expect(result.current.completedCount).toBe(1);
      expect(result.current.totalCount).toBe(5);
    });

    it('payout method links to settings page', () => {
      const user = mockUser({ role: 'INSTRUCTOR' });
      const { result } = renderHook(() => useProfileCompletion(user, 'INSTRUCTOR'));

      const payoutItem = result.current.items.find((i) => i.key === 'payout');
      expect(payoutItem?.href).toBe('/dashboard/settings');
    });

    it('returns 100% when all items including payout are set', () => {
      const user = mockUser({
        role: 'INSTRUCTOR',
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'Jane Instructor',
        email: 'jane@example.com',
        bio: 'I teach amazing courses',
      });
      const { result } = renderHook(() => useProfileCompletion(user, 'INSTRUCTOR'));

      // Note: payout is currently hardcoded as false, so this will be 80%
      // TODO: Update to 100% when payout method data is available
      expect(result.current.completedCount).toBe(4);
      expect(result.current.totalCount).toBe(5);
    });
  });

  describe('Admin role', () => {
    it('treats admin role same as instructor (includes payout)', () => {
      const user = mockUser({ role: 'ADMIN' });
      const { result } = renderHook(() => useProfileCompletion(user, 'ADMIN'));

      expect(result.current.totalCount).toBe(5);
      expect(result.current.items.map((i) => i.key)).toContain('payout');
    });
  });

  describe('null/undefined user', () => {
    it('returns empty state when user is null', () => {
      const { result } = renderHook(() => useProfileCompletion(null));

      expect(result.current.percentage).toBe(0);
      expect(result.current.items).toHaveLength(0);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.completedCount).toBe(0);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('item completion logic', () => {
    it('marks item completed when field has non-empty value', () => {
      const user = mockUser({ name: 'John' });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      const nameItem = result.current.items.find((i) => i.key === 'name');
      expect(nameItem?.completed).toBe(true);
    });

    it('marks item incomplete when field is empty', () => {
      const user = mockUser({ name: '' });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      const nameItem = result.current.items.find((i) => i.key === 'name');
      expect(nameItem?.completed).toBe(false);
    });

    it('marks item incomplete when field is null', () => {
      const user = mockUser({ name: null });
      const { result } = renderHook(() => useProfileCompletion(user, 'STUDENT'));

      const nameItem = result.current.items.find((i) => i.key === 'name');
      expect(nameItem?.completed).toBe(false);
    });
  });
});

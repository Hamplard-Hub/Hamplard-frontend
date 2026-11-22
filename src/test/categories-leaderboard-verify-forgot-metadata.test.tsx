import { describe, it, expect } from 'vitest';
import { metadata as categoriesMetadata } from '@/app/categories/layout';
import { metadata as leaderboardMetadata } from '@/app/leaderboard/layout';
import { metadata as verifyMetadata } from '@/app/verify/layout';
import { metadata as forgotPasswordMetadata } from '@/app/forgot-password/layout';

describe('Categories, Leaderboard, Verify, and Forgot-Password Metadata (#615)', () => {
  it('defines indexable metadata for /categories', () => {
    expect(categoriesMetadata.title).toBe('Course Categories');
    expect(categoriesMetadata.alternates?.canonical).toContain('/categories');
    expect(categoriesMetadata.robots).toBeUndefined();
  });

  it('defines indexable metadata for /leaderboard', () => {
    expect(leaderboardMetadata.title).toBe('Learner Leaderboard');
    expect(leaderboardMetadata.alternates?.canonical).toContain('/leaderboard');
    expect(leaderboardMetadata.robots).toBeUndefined();
  });

  it('defines noIndex metadata for /verify', () => {
    expect(verifyMetadata.title).toBe('Verify Email');
    expect(verifyMetadata.robots).toEqual({ index: false, follow: true });
  });

  it('defines noIndex metadata for /forgot-password', () => {
    expect(forgotPasswordMetadata.title).toBe('Forgot Password');
    expect(forgotPasswordMetadata.robots).toEqual({ index: false, follow: true });
  });
});

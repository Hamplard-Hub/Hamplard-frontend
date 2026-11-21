import { describe, it, expect } from 'vitest';

// ── Inline the pure path-matching logic so we can unit-test it without
//    spinning up a Next.js environment. ────────────────────────────────────

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/login',
  '/auth/signup',
  '/courses',
  '/certificates',
];

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/checkout',
  '/notifications',
  '/gift',
  '/settings',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

// ─────────────────────────────────────────────────────────────────────────────

describe('isPublicPath', () => {
  it('matches exact public paths', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/signup')).toBe(true);
    expect(isPublicPath('/courses')).toBe(true);
    expect(isPublicPath('/certificates')).toBe(true);
  });

  it('matches sub-routes of public paths', () => {
    expect(isPublicPath('/courses/abc-123')).toBe(true);
    expect(isPublicPath('/certificates/verify/xyz')).toBe(true);
    expect(isPublicPath('/auth/login')).toBe(true);
  });

  it('does NOT treat a path that shares a prefix as public', () => {
    // "/coursesX" must not be treated as a sub-route of "/courses".
    expect(isPublicPath('/coursesX')).toBe(false);
    expect(isPublicPath('/loginx')).toBe(false);
    expect(isPublicPath('/signupExtra')).toBe(false);
  });

  it('returns false for protected and unknown paths', () => {
    expect(isPublicPath('/dashboard')).toBe(false);
    expect(isPublicPath('/checkout')).toBe(false);
    expect(isPublicPath('/notifications')).toBe(false);
    expect(isPublicPath('/unknown-page')).toBe(false);
  });
});

describe('isProtectedPath', () => {
  it('matches each protected prefix exactly', () => {
    for (const prefix of PROTECTED_PREFIXES) {
      expect(isProtectedPath(prefix)).toBe(true);
    }
  });

  it('matches sub-routes of protected prefixes', () => {
    expect(isProtectedPath('/dashboard/courses')).toBe(true);
    expect(isProtectedPath('/checkout/confirm')).toBe(true);
    expect(isProtectedPath('/notifications/settings')).toBe(true);
    expect(isProtectedPath('/gift/course-abc')).toBe(true);
  });

  it('does NOT match paths that only share a prefix string', () => {
    // "/dashboardAdmin" is not a sub-route of "/dashboard".
    expect(isProtectedPath('/dashboardAdmin')).toBe(false);
    expect(isProtectedPath('/checkoutExtra')).toBe(false);
  });

  it('returns false for public and unrelated paths', () => {
    expect(isProtectedPath('/login')).toBe(false);
    expect(isProtectedPath('/courses/intro')).toBe(false);
    expect(isProtectedPath('/')).toBe(false);
  });
});

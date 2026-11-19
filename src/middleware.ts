import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Exact public paths and their sub-routes.
 * Matching is segment-aware: `/courses` is public but `/coursesX` is not.
 */
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/login',
  '/auth/signup',
  '/courses',
  '/certificates',
];

/**
 * Routes that require authentication.
 * Any path that starts with one of these prefixes (or equals it) is protected.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/checkout',
  '/notifications',
  '/gift',
  '/settings',
];

/** Returns true when the path is public (exact match or sub-route). */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

/** Returns true when the path requires the user to be authenticated. */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root and public paths need no auth check.
  if (pathname === '/' || isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get('hamplard_token')?.value;

  if (!token && isProtectedPath(pathname)) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|public).*)'],
};

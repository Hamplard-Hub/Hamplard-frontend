import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/courses', '/certificates'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public: auth page, public course browsing, certificate verification
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  // Root and static
  if (pathname === '/') return NextResponse.next();

  const token = request.cookies.get('hamplard_token')?.value;
  if (!token && pathname.startsWith('/dashboard')) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|public).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_AUTH_COOKIE, createAdminSession } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (session === createAdminSession()) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};

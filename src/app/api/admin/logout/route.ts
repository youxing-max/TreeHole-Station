import { NextResponse } from 'next/server';
import { getExpiredAdminSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const sessionCookie = getExpiredAdminSessionCookie();
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
  return response;
}

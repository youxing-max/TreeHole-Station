import { NextResponse } from 'next/server';
import { getAdminSessionCookie, isValidAdminSecret } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = typeof body.secret === 'string' ? body.secret.trim() : '';

    if (!secret) {
      return NextResponse.json({ error: '请输入后台口令' }, { status: 400 });
    }

    if (!isValidAdminSecret(secret)) {
      return NextResponse.json({ error: '后台口令错误' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    const sessionCookie = getAdminSessionCookie();
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
    return response;
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}

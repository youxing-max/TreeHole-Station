import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_AUTH_COOKIE = 'admin-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAdminSecret() {
  return process.env.ADMIN_SECRET || 'admin123456';
}

function getSessionValue() {
  return crypto
    .createHash('sha256')
    .update(getAdminSecret())
    .digest('hex');
}

export function isValidAdminSecret(secret: string) {
  return secret === getAdminSecret();
}

export function createAdminSession() {
  return getSessionValue();
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_AUTH_COOKIE)?.value;
  return value === getSessionValue();
}

export async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return Response.json({ error: '未授权访问' }, { status: 401 });
  }

  return null;
}

export function getAdminSessionCookie() {
  return {
    name: ADMIN_AUTH_COOKIE,
    value: createAdminSession(),
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: false,
      path: '/',
      maxAge: SESSION_MAX_AGE,
    },
  };
}

export function getExpiredAdminSessionCookie() {
  return {
    name: ADMIN_AUTH_COOKIE,
    value: '',
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: false,
      path: '/',
      maxAge: 0,
    },
  };
}

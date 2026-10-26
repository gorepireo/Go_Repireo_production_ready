import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { getTurso } from './turso';

export const SESSION_COOKIE = 'gr_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const REGISTRATION_LIFETIME_SECONDS = 60 * 15;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function cookieToken(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join('='));
  }
  return '';
}

function serializeCookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function createSession(phone: string, purpose: 'login' | 'register', userId: string | null) {
  const token = randomBytes(32).toString('base64url');
  const lifetime = purpose === 'login' ? SESSION_LIFETIME_SECONDS : REGISTRATION_LIFETIME_SECONDS;
  const expiresAt = new Date(Date.now() + lifetime * 1000).toISOString();
  await getTurso().execute({
    sql: 'INSERT INTO auth_sessions (token_hash, user_id, phone, purpose, expires_at) VALUES (?, ?, ?, ?, ?)',
    args: [hashToken(token), userId, phone, purpose, expiresAt],
  });
  return { token, cookie: serializeCookie(token, lifetime) };
}

export async function readSession(request: Request, purpose: 'login' | 'register' = 'login') {
  const token = cookieToken(request);
  if (!token) return null;
  const result = await getTurso().execute({
    sql: `SELECT token_hash, user_id, phone, purpose, expires_at
          FROM auth_sessions WHERE token_hash = ? AND purpose = ? AND expires_at > ? LIMIT 1`,
    args: [hashToken(token), purpose, new Date().toISOString()],
  });
  return result.rows[0] || null;
}

export async function deleteSession(request: Request) {
  const token = cookieToken(request);
  if (token) await getTurso().execute({ sql: 'DELETE FROM auth_sessions WHERE token_hash = ?', args: [hashToken(token)] });
}

export function clearSessionCookie() {
  return serializeCookie('', 0);
}

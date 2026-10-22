import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const MEMBER_COOKIE = 'jj_member';
const ADMIN_COOKIE = 'jj_admin';
const GUIDE_COOKIE = 'jj_guide';
const YEAR = 60 * 60 * 24 * 365;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET is missing or too short');
  return s;
}

function sign(value) {
  const mac = crypto.createHmac('sha256', secret()).update(value).digest('base64url');
  return `${value}.${mac}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const value = token.slice(0, i);
  const expected = sign(value);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});

export function getMemberId() {
  const token = cookies().get(MEMBER_COOKIE)?.value;
  try {
    return verify(token);
  } catch {
    return null;
  }
}

export function setMemberCookie(response, memberId) {
  response.cookies.set(MEMBER_COOKIE, sign(memberId), cookieOptions(YEAR));
}

export function clearMemberCookie(response) {
  response.cookies.set(MEMBER_COOKIE, '', cookieOptions(0));
}

export function isAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  try {
    return verify(token) === 'admin';
  } catch {
    return false;
  }
}

export function setAdminCookie(response) {
  response.cookies.set(ADMIN_COOKIE, sign('admin'), cookieOptions(60 * 60 * 24 * 30));
}

export function clearAdminCookie(response) {
  response.cookies.set(ADMIN_COOKIE, '', cookieOptions(0));
}

export function passwordMatches(input) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || typeof input !== 'string') return false;
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

// Remembers that this visitor already unlocked the buyer guide.
export function setGuideCookie(response) {
  response.cookies.set(GUIDE_COOKIE, sign('guide'), cookieOptions(YEAR));
}

export function hasGuide() {
  const token = cookies().get(GUIDE_COOKIE)?.value;
  try {
    return verify(token) === 'guide';
  } catch {
    return false;
  }
}

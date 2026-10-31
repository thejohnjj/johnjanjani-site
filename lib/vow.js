// VOW (Virtual Office Website) accounts: the password-protected part of the site that shows sold prices.
// PropTx MLS® Rules, Article 8:
//  - 8.05: name + valid email, confirmation email, Terms of Use accepted by click, unique username (email) + password
//  - 8.06: passwords valid for no more than 90 days (renewal allowed); records kept 180+ days after expiry
//  - 8.09: Terms of Use content (see /[lang]/vow-terms)
// Passwords are stored only as scrypt hashes.
import 'server-only';
import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/supabase';

export const PASSWORD_DAYS = 90;
export const TERMS_VERSION = '2026-10-31';
const VOW_COOKIE = 'jj_vow';
const SESSION_DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET is missing or too short');
  return s;
}

const mac = (v) => crypto.createHmac('sha256', secret()).update(`vow|${v}`).digest('base64url');

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function checkPassword(pw, stored) {
  const [kind, salt, hash] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const want = Buffer.from(hash, 'base64url');
  const got = crypto.scryptSync(String(pw), Buffer.from(salt, 'base64url'), want.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(want, got);
}

export function passwordProblem(pw) {
  const s = String(pw || '');
  if (s.length < 8) return 'short';
  if (s.length > 200) return 'long';
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) return 'weak';
  return null;
}

// Signed links for email confirmation and password reset. Tied to the current password date,
// so a reset link stops working once it has been used.
export function signToken(memberId, purpose, expires, bind = '') {
  return mac(`${purpose}|${memberId}|${expires}|${bind}`).slice(0, 32);
}
export function checkToken(memberId, purpose, expires, bind, sig) {
  if (!memberId || !sig || !(Number(expires) > Date.now())) return false;
  const want = Buffer.from(signToken(memberId, purpose, expires, bind));
  const got = Buffer.from(String(sig));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

const stamp = (d) => (d ? new Date(d).getTime() : 0);

export function setVowCookie(res, member) {
  const value = `${member.id}.${stamp(member.password_set_at)}`;
  res.cookies.set(VOW_COOKIE, `${value}.${mac(value).slice(0, 32)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
}

export function clearVowCookie(res) {
  res.cookies.set(VOW_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

const MEMBER_FIELDS = 'id, name, email, phone, lang, password_hash, password_set_at, email_verified_at, vow_terms_at, vow_terms_version';

export function vowState(m) {
  if (!m?.password_hash) return 'none';
  if (!m.email_verified_at) return 'unverified';
  if (!m.vow_terms_at) return 'terms';
  if (Date.now() - stamp(m.password_set_at) > PASSWORD_DAYS * 86400000) return 'expired';
  return 'ok';
}

// Who is looking at a VOW page, and may they see sold data?
// status: 'guest' | 'unverified' | 'terms' | 'expired' | 'ok'
export async function getVowAccess() {
  if (process.env.PROPTX_FIXTURE === '1') {
    const st = process.env.PROPTX_FIXTURE_VOW || 'ok';
    return { status: st, member: st === 'guest' ? null : { id: '00000000-0000-0000-0000-000000000000', name: 'Sample Member', email: 'sample@example.com', lang: 'en' } };
  }
  const raw = cookies().get(VOW_COOKIE)?.value || '';
  const [id, ts, sig] = raw.split('.');
  if (!id || !sig) return { status: 'guest', member: null };
  const want = mac(`${id}.${ts}`).slice(0, 32);
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return { status: 'guest', member: null };
  const client = db();
  if (!client) return { status: 'guest', member: null };
  const { data: m } = await client.from('members').select(MEMBER_FIELDS).eq('id', id).maybeSingle();
  if (!m || String(stamp(m.password_set_at)) !== ts) return { status: 'guest', member: null };
  const state = vowState(m);
  return { status: state === 'none' ? 'guest' : state, member: { id: m.id, name: m.name, email: m.email, lang: m.lang } };
}

export async function findMemberByEmail(email) {
  const client = db();
  if (!client) return null;
  const { data } = await client.from('members').select(MEMBER_FIELDS).eq('email', String(email || '').trim().toLowerCase()).maybeSingle();
  return data || null;
}

export async function getMemberById(id) {
  const client = db();
  if (!client || !/^[0-9a-f-]{36}$/i.test(id || '')) return null;
  const { data } = await client.from('members').select(MEMBER_FIELDS).eq('id', id).maybeSingle();
  return data || null;
}

export async function updateMember(id, patch) {
  const client = db();
  const { data, error } = await client.from('members').update(patch).eq('id', id).select(MEMBER_FIELDS).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Simple brute-force guard for sign-in and reset requests (uses the feed audit log table).
export async function tooManyAttempts(action, limit = 8, minutes = 15) {
  const client = db();
  if (!client) return false;
  const h = headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ipHash = crypto.createHash('sha256').update((process.env.SESSION_SECRET || '') + ip).digest('hex').slice(0, 32);
  const since = new Date(Date.now() - minutes * 60000).toISOString();
  const { count } = await client.from('feed_audit').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).eq('action', action).gte('at', since);
  await client.from('feed_audit').insert({ ip_hash: ipHash, kind: 'vow', action, user_agent: (h.get('user-agent') || '').slice(0, 300) });
  return (count || 0) >= limit;
}

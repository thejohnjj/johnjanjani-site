import { NextResponse } from 'next/server';
import { setMemberCookie } from '@/lib/session';
import { upsertMember, EMAIL } from '@/lib/members';
import { findMemberByEmail, hashPassword, passwordProblem, updateMember, TERMS_VERSION, tooManyAttempts } from '@/lib/vow';
import { sendVerify, safeNext } from '../_shared';

export const runtime = 'nodejs';

// Creates a VOW account (or adds a password to an existing member) and sends the confirmation email.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(b.phone || '').trim().slice(0, 40);
  const lang = b.lang === 'fa' ? 'fa' : 'en';
  if (name.length < 2) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  if (phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'phone' }, { status: 400 });
  const pw = passwordProblem(b.password);
  if (pw) return NextResponse.json({ error: `password_${pw}` }, { status: 400 });
  if (b.terms !== true) return NextResponse.json({ error: 'terms' }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: 'consent' }, { status: 400 });
  if (await tooManyAttempts('vow_register', 6, 30)) return NextResponse.json({ error: 'slow_down' }, { status: 429 });

  const existing = await findMemberByEmail(email);
  if (existing?.password_hash) return NextResponse.json({ error: 'exists' }, { status: 409 });
  try {
    const { id } = await upsertMember({ name, email, phone, lang, source: 'Sold prices sign-up', firstListing: b.firstListing ? String(b.firstListing).slice(0, 160) : null });
    const now = new Date().toISOString();
    const member = await updateMember(id, { password_hash: hashPassword(b.password), password_set_at: now, vow_terms_at: now, vow_terms_version: TERMS_VERSION, email_verified_at: null });
    const sent = await sendVerify(member, lang, safeNext(b.next));
    const res = NextResponse.json({ ok: true, verify: true, sent });
    setMemberCookie(res, id);
    return res;
  } catch (e) {
    console.error('vow register', e?.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

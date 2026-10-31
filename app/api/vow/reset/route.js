import { NextResponse } from 'next/server';
import { setMemberCookie } from '@/lib/session';
import { checkToken, getMemberById, hashPassword, passwordProblem, setVowCookie, updateMember, TERMS_VERSION } from '@/lib/vow';

export const runtime = 'nodejs';

// New password from the reset link. The link proves the email address, so it also counts as confirmation.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const m = await getMemberById(b.m);
  const bind = String(m?.password_set_at ? new Date(m.password_set_at).getTime() : 0);
  if (!m || !checkToken(m.id, 'reset', b.e, bind, b.s)) return NextResponse.json({ error: 'link' }, { status: 400 });
  const pw = passwordProblem(b.password);
  if (pw) return NextResponse.json({ error: `password_${pw}` }, { status: 400 });
  if (b.terms !== true) return NextResponse.json({ error: 'terms' }, { status: 400 });
  const now = new Date().toISOString();
  const member = await updateMember(m.id, {
    password_hash: hashPassword(b.password), password_set_at: now, vow_terms_at: now, vow_terms_version: TERMS_VERSION,
    email_verified_at: m.email_verified_at || now, last_login_at: now,
  });
  const res = NextResponse.json({ ok: true, name: member.name });
  setMemberCookie(res, member.id);
  setVowCookie(res, member);
  return res;
}

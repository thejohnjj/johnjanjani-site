import { NextResponse } from 'next/server';
import { setMemberCookie } from '@/lib/session';
import { checkPassword, findMemberByEmail, hashPassword, passwordProblem, setVowCookie, tooManyAttempts, updateMember, TERMS_VERSION } from '@/lib/vow';

export const runtime = 'nodejs';

// 90-day renewal (rule 8.06): confirm the current password, choose a new one, accept the Terms of Use again.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  if (await tooManyAttempts('vow_login', 10, 15)) return NextResponse.json({ error: 'slow_down' }, { status: 429 });
  const m = await findMemberByEmail(b.email);
  if (!m?.password_hash || !checkPassword(String(b.password || ''), m.password_hash)) return NextResponse.json({ error: 'wrong' }, { status: 401 });
  const pw = passwordProblem(b.newPassword);
  if (pw) return NextResponse.json({ error: `password_${pw}` }, { status: 400 });
  if (b.newPassword === b.password) return NextResponse.json({ error: 'password_same' }, { status: 400 });
  if (b.terms !== true) return NextResponse.json({ error: 'terms' }, { status: 400 });
  const now = new Date().toISOString();
  const member = await updateMember(m.id, { password_hash: hashPassword(b.newPassword), password_set_at: now, vow_terms_at: now, vow_terms_version: TERMS_VERSION, last_login_at: now });
  const res = NextResponse.json({ ok: true, name: member.name, verified: Boolean(member.email_verified_at) });
  setMemberCookie(res, member.id);
  if (member.email_verified_at) setVowCookie(res, member);
  return res;
}

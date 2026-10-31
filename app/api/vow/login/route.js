import { NextResponse } from 'next/server';
import { setMemberCookie } from '@/lib/session';
import { checkPassword, findMemberByEmail, setVowCookie, tooManyAttempts, updateMember, vowState } from '@/lib/vow';
import { sendVerify } from '../_shared';

export const runtime = 'nodejs';

export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  if (await tooManyAttempts('vow_login', 10, 15)) return NextResponse.json({ error: 'slow_down' }, { status: 429 });
  const m = await findMemberByEmail(b.email);
  if (!m?.password_hash) return NextResponse.json({ error: m ? 'no_password' : 'wrong' }, { status: m ? 409 : 401 });
  if (!checkPassword(String(b.password || ''), m.password_hash)) return NextResponse.json({ error: 'wrong' }, { status: 401 });
  const lang = b.lang === 'fa' ? 'fa' : m.lang;
  const state = vowState(m);
  if (state === 'unverified') {
    await sendVerify(m, lang);
    return NextResponse.json({ error: 'unverified' }, { status: 403 });
  }
  if (state === 'expired' || state === 'terms') return NextResponse.json({ error: 'expired' }, { status: 403 });
  const member = await updateMember(m.id, { last_login_at: new Date().toISOString(), last_seen_at: new Date().toISOString() });
  const res = NextResponse.json({ ok: true, name: member.name });
  setMemberCookie(res, member.id);
  setVowCookie(res, member);
  return res;
}

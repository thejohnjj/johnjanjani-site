import { NextResponse } from 'next/server';
import { setMemberCookie } from '@/lib/session';
import { checkToken, getMemberById, setVowCookie, updateMember } from '@/lib/vow';
import { SITE } from '@/lib/site';
import { safeNext } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Link in the confirmation email: marks the email as verified and signs the member in.
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const lang = sp.get('l') === 'fa' ? 'fa' : 'en';
  const m = await getMemberById(sp.get('m'));
  if (!m || !checkToken(m.id, 'verify', sp.get('e'), '', sp.get('s'))) {
    return NextResponse.redirect(`${SITE}/${lang}/account?state=link-expired`, 302);
  }
  const member = m.email_verified_at ? m : await updateMember(m.id, { email_verified_at: new Date().toISOString(), last_login_at: new Date().toISOString() });
  const next = safeNext(sp.get('n'));
  const res = NextResponse.redirect(`${SITE}${next || `/${lang}/sold?welcome=1`}`, 302);
  setMemberCookie(res, member.id);
  setVowCookie(res, member);
  return res;
}

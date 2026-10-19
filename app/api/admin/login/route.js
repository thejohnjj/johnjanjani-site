import { NextResponse } from 'next/server';
import { passwordMatches, setAdminCookie, clearAdminCookie } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {}
  if (body.logout) {
    const res = NextResponse.json({ ok: true });
    clearAdminCookie(res);
    return res;
  }
  if (!passwordMatches(String(body.password || ''))) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}

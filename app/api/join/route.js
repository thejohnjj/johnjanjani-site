import { NextResponse } from 'next/server';
import { setMemberCookie } from '@/lib/session';
import { upsertMember, EMAIL } from '@/lib/members';

export const runtime = 'nodejs';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 40);
  const lang = body.lang === 'fa' ? 'fa' : 'en';
  const consent = body.consent === true;
  const firstListing = body.firstListing ? String(body.firstListing).slice(0, 160) : null;

  if (name.length < 2) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  if (phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'phone' }, { status: 400 });
  if (!consent) return NextResponse.json({ error: 'consent' }, { status: 400 });

  try {
    const { id } = await upsertMember({ name, email, phone, lang, firstListing });
    const res = NextResponse.json({ ok: true, name });
    setMemberCookie(res, id);
    return res;
  } catch (e) {
    console.error('join', e?.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

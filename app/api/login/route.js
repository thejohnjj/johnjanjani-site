import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { setMemberCookie } from '@/lib/session';

export const runtime = 'nodejs';

// Returning members sign back in with the email they joined with.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const email = String(body.email || '').trim().toLowerCase();
  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });
  const { data } = await client.from('members').select('id, name').eq('email', email).maybeSingle();
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await client.from('members').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id);
  const res = NextResponse.json({ ok: true, name: data.name });
  setMemberCookie(res, data.id);
  return res;
}

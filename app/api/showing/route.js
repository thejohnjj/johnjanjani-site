import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getMemberId } from '@/lib/session';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';

export async function POST(req) {
  const memberId = getMemberId();
  if (!memberId) return NextResponse.json({ error: 'not_member' }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });
  const [{ data: member }, { data: listing }] = await Promise.all([
    client.from('members').select('id, name, email, phone').eq('id', memberId).maybeSingle(),
    client.from('listings').select('id, address, mls_number, type_en, city_en').eq('id', String(body.listingId || '')).maybeSingle(),
  ]);
  if (!member || !listing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await client.from('showing_requests').insert({ member_id: member.id, listing_id: listing.id });
  await notify(`Showing request: ${listing.address}`, [
    `${member.name} wants to see ${listing.type_en} at ${listing.address}${listing.mls_number ? ` (MLS ${listing.mls_number})` : ''}.`,
    `Phone: ${member.phone}`,
    `Email: ${member.email}`,
  ]);
  return NextResponse.json({ ok: true });
}

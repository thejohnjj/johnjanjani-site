import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/session';

export const runtime = 'nodejs';

// Removes one member (e.g. a test account). Their listing views and showing requests go with them.
export async function DELETE(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  const client = db();
  if (!client || !/^[0-9a-f-]{36}$/i.test(id || '')) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const { error } = await client.from('members').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

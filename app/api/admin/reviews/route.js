import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/session';

export const runtime = 'nodejs';

// Add or update a client review (send an id to update).
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const row = {
    name: String(b.name || '').trim().slice(0, 80),
    text_en: String(b.text_en || '').trim().slice(0, 1200) || null,
    text_fa: String(b.text_fa || '').trim().slice(0, 1200) || null,
    rating: Math.min(5, Math.max(1, parseInt(b.rating, 10) || 5)),
    source: String(b.source || '').trim().slice(0, 60) || null,
    active: b.active !== false,
    sort_order: parseInt(b.sort_order, 10) || 0,
  };
  if (!row.name || (!row.text_en && !row.text_fa)) {
    return NextResponse.json({ error: 'Name and the review text (English or Farsi) are required.' }, { status: 400 });
  }
  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });
  const q = b.id ? client.from('reviews').update(row).eq('id', b.id) : client.from('reviews').insert(row);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('reviews');
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  const client = db();
  if (!client || !id) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const { error } = await client.from('reviews').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('reviews');
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

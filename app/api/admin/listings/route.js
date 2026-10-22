import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/session';
import { slugify } from '@/lib/format';
import { cleanCode } from '@/lib/listings';

export const runtime = 'nodejs';

function lines(v) {
  return String(v || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

// Create or update a listing (send an id to update).
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const price = parseInt(String(b.price || '').replace(/\D/g, ''), 10);
  const row = {
    code: cleanCode(b.code) || null,
    mls_number: String(b.mls_number || '').trim() || null,
    status: b.status === 'rent' ? 'rent' : 'sale',
    kind: ['house', 'townhouse', 'condo'].includes(b.kind) ? b.kind : 'house',
    city_en: String(b.city_en || '').trim(),
    city_fa: String(b.city_fa || '').trim(),
    type_en: String(b.type_en || '').trim(),
    type_fa: String(b.type_fa || '').trim(),
    price: Number.isFinite(price) ? price : 0,
    address: String(b.address || '').trim(),
    beds: Number(b.beds) || 0,
    baths: Number(b.baths) || 0,
    parking: parseInt(b.parking, 10) || 0,
    sqft: String(b.sqft || '').trim(),
    description_en: String(b.description_en || '').trim(),
    description_fa: String(b.description_fa || '').trim(),
    features_en: lines(b.features_en),
    features_fa: lines(b.features_fa),
    photos: Array.isArray(b.photos) ? b.photos.filter((u) => typeof u === 'string' && u.startsWith('https://')).slice(0, 60) : [],
    listing_brokerage: String(b.listing_brokerage || '').trim(),
    tour_url: /^https:\/\//.test(String(b.tour_url || '').trim()) ? String(b.tour_url).trim() : null,
    active: b.active !== false,
    sort_order: parseInt(b.sort_order, 10) || 0,
    updated_at: new Date().toISOString(),
  };
  // Daily picks: only sent when the admin form says which section (needs the new SQL columns).
  if (b.section === 'pick' || b.section === 'tour') {
    row.section = b.section;
    row.pick_note_en = String(b.pick_note_en || '').trim().slice(0, 300);
    row.pick_note_fa = String(b.pick_note_fa || '').trim().slice(0, 300);
    const exp = b.expires_at ? new Date(b.expires_at) : null;
    row.expires_at = b.section === 'pick' ? (exp && !isNaN(exp) ? exp.toISOString() : b.id ? null : new Date(Date.now() + 14 * 864e5).toISOString()) : null;
    if (b.section === 'pick') row.code = cleanCode(b.code) || null;
  }
  if (!row.city_en || !row.type_en || !row.address || !row.price || !row.listing_brokerage) {
    return NextResponse.json({ error: 'City, type, address, price and listing brokerage are required.' }, { status: 400 });
  }

  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });

  let result;
  if (b.id) {
    result = await client.from('listings').update(row).eq('id', b.id).select('id, slug').single();
  } else {
    const base = slugify(`${row.type_en} ${row.city_en} ${row.mls_number || ''}`) || 'listing';
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data } = await client.from('listings').select('id').eq('slug', slug).maybeSingle();
      if (!data) break;
      slug = `${base}-${i}`;
    }
    result = await client.from('listings').insert({ ...row, slug }).select('id, slug').single();
  }
  if (result.error) {
    const dup = /listings_code_key|duplicate/i.test(result.error.message);
    if (/section|pick_note|expires_at/.test(result.error.message)) {
      return NextResponse.json({ error: 'One step left: run the new “Daily picks” SQL from supabase/schema.sql in Supabase → SQL Editor, then save again.' }, { status: 500 });
    }
    return NextResponse.json({ error: dup ? `Code ${row.code} is already used by another listing.` : result.error.message }, { status: dup ? 409 : 500 });
  }
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, ...result.data });
}

export async function DELETE(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const client = db();
  if (!client || !id) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const { error } = await client.from('listings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

// Returns all listings with every field (admin only), for bulk edits.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });
  const { data, error } = await client.from('listings').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data });
}

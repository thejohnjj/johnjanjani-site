import 'server-only';
import { db } from './supabase';


// Removes price and address unless the visitor is a member, so they never reach the browser.
export function shape(row, isMember) {
  if (!row) return null;
  const base = {
    id: row.id,
    slug: row.slug,
    code: row.code || '',
    mls: row.mls_number || '',
    status: row.status,
    kind: row.kind,
    city: { en: row.city_en, fa: row.city_fa || row.city_en },
    type: { en: row.type_en, fa: row.type_fa || row.type_en },
    beds: Number(row.beds),
    baths: Number(row.baths),
    parking: row.parking,
    sqft: row.sqft,
    description: { en: row.description_en, fa: row.description_fa || row.description_en },
    features: { en: row.features_en || [], fa: (row.features_fa && row.features_fa.length ? row.features_fa : row.features_en) || [] },
    photos: row.photos || [],
    brokerage: row.listing_brokerage || '',
    tour: row.tour_url || '',
    section: row.section === 'pick' ? 'pick' : 'tour',
    note: { en: row.pick_note_en || '', fa: row.pick_note_fa || row.pick_note_en || '' },
    pickedAt: row.created_at,
  };
  if (isMember) {
    base.price = row.price;
    base.address = row.address;
  }
  return base;
}

export async function getListings(isMember) {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from('listings')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getListings', error.message);
    return [];
  }
  return sortByCode(data.filter((r) => !isExpired(r))).map((r) => shape(r, isMember));
}

// Daily picks hide themselves after their end date (sold or old).
export function isExpired(row) {
  return row.section === 'pick' && row.expires_at && new Date(row.expires_at).getTime() < Date.now();
}

// Splits listings into toured homes (by code) and daily picks (newest first), with a picked-on date label.
export function splitListings(listings, lang) {
  const fmt = new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-CA', { month: 'long', day: 'numeric', timeZone: 'America/Toronto' });
  const tours = listings.filter((l) => l.section !== 'pick');
  const picks = listings
    .filter((l) => l.section === 'pick')
    .sort((a, b) => String(b.pickedAt).localeCompare(String(a.pickedAt)))
    .map((l) => ({ ...l, pickedLabel: l.pickedAt ? fmt.format(new Date(l.pickedAt)) : '' }));
  return { tours, picks };
}

// Orders listings by their code, highest (newest) first; listings without a code go last.
export function sortByCode(rows) {
  const num = (c) => {
    const n = parseInt(String(c || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : -Infinity;
  };
  return [...rows].sort((a, b) => num(b.code) - num(a.code) || String(b.created_at).localeCompare(String(a.created_at)));
}

export async function getListing(slug, isMember) {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error) {
    console.error('getListing', error.message);
    return null;
  }
  if (data && isExpired(data)) return null;
  return shape(data, isMember);
}

export async function getMember(memberId) {
  const client = db();
  if (!client || !memberId) return null;
  const { data } = await client.from('members').select('id, name, email, first_listing').eq('id', memberId).maybeSingle();
  return data || null;
}

export async function recordView(member, listing) {
  const client = db();
  if (!client || !member || !listing) return;
  await client.from('listing_views').insert({ member_id: member.id, listing_id: listing.id });
  const patch = { last_seen_at: new Date().toISOString() };
  if (!member.first_listing) patch.first_listing = `${listing.type.en} · ${listing.city.en}`;
  await client.from('members').update(patch).eq('id', member.id);
}

export function cleanCode(c) {
  return String(c || '').trim().replace(/^#/, '').replace(/^code[:\s]*/i, '').replace(/\s+/g, '').slice(0, 20);
}

// Finds an active listing's slug by its code (case-insensitive).
export async function slugForCode(code) {
  const client = db();
  const c = cleanCode(code);
  if (!client || !c) return null;
  const { data } = await client.from('listings').select('slug').ilike('code', c).eq('active', true).limit(1).maybeSingle();
  return data?.slug || null;
}

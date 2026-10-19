import 'server-only';
import { db } from './supabase';

const PUBLIC_FIELDS =
  'id, slug, mls_number, status, kind, city_en, city_fa, type_en, type_fa, price, address, beds, baths, parking, sqft, description_en, description_fa, features_en, features_fa, photos, sort_order, created_at';

// Removes price and address unless the visitor is a member, so they never reach the browser.
export function shape(row, isMember) {
  if (!row) return null;
  const base = {
    id: row.id,
    slug: row.slug,
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
    .select(PUBLIC_FIELDS)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getListings', error.message);
    return [];
  }
  return data.map((r) => shape(r, isMember));
}

export async function getListing(slug, isMember) {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from('listings')
    .select(PUBLIC_FIELDS)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error) {
    console.error('getListing', error.message);
    return null;
  }
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

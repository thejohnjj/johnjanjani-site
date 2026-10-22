import { SITE } from '@/lib/site';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const site = SITE;
  const now = new Date();
  const pri = { '': 1, '/home-value': 0.9, '/guide': 0.8, '/seller-guide': 0.8, '/calculator': 0.8, '/privacy': 0.3 };
  const pages = Object.keys(pri).flatMap((p) =>
    ['en', 'fa'].map((lang) => ({ url: `${site}/${lang}${p}`, lastModified: now, changeFrequency: p === '/privacy' ? 'yearly' : 'weekly', priority: pri[p] }))
  );
  const client = db();
  if (!client) return pages;
  const { data } = await client.from('listings').select('slug, updated_at').eq('active', true);
  const listingPages = (data || []).flatMap((l) =>
    ['en', 'fa'].map((lang) => ({ url: `${site}/${lang}/listings/${l.slug}`, lastModified: new Date(l.updated_at), changeFrequency: 'weekly', priority: 0.8 }))
  );
  return [...pages, ...listingPages];
}

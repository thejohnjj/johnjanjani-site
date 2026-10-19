import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const site = process.env.SITE_URL || 'https://johnjanjani.com';
  const now = new Date();
  const pages = ['', '/privacy'].flatMap((p) =>
    ['en', 'fa'].map((lang) => ({ url: `${site}/${lang}${p}`, lastModified: now, changeFrequency: p ? 'yearly' : 'weekly', priority: p ? 0.3 : 1 }))
  );
  const client = db();
  if (!client) return pages;
  const { data } = await client.from('listings').select('slug, updated_at').eq('active', true);
  const listingPages = (data || []).flatMap((l) =>
    ['en', 'fa'].map((lang) => ({ url: `${site}/${lang}/listings/${l.slug}`, lastModified: new Date(l.updated_at), changeFrequency: 'weekly', priority: 0.8 }))
  );
  return [...pages, ...listingPages];
}

import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './supabase';

// Active reviews, cached for 10 minutes and refreshed right away when the admin saves one.
export const getReviews = unstable_cache(
  async () => {
    const client = db();
    if (!client) return [];
    const { data, error } = await client
      .from('reviews')
      .select('id, name, text_en, text_fa, rating, source')
      .eq('active', true)
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },
  ['reviews-active-v1'],
  { revalidate: 600, tags: ['reviews'] }
);

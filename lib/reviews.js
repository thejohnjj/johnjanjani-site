import 'server-only';
import { db } from './supabase';

export async function getReviews() {
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
}

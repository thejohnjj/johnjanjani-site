import 'server-only';
import { createClient } from '@supabase/supabase-js';

let client = null;

// Accepts the project address with or without a trailing slash or /rest/v1.
export function cleanUrl(u) {
  return String(u || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '').replace(/\/+$/, '');
}

// Server-side Supabase client. Uses the service role key, so it must never run in the browser.
export function db() {
  const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export const PHOTO_BUCKET = 'listing-photos';

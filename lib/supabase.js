import 'server-only';
import { createClient } from '@supabase/supabase-js';

let client = null;

// Server-side Supabase client. Uses the service role key, so it must never run in the browser.
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export const PHOTO_BUCKET = 'listing-photos';

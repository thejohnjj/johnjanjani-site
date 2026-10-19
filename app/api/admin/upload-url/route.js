import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, PHOTO_BUCKET } from '@/lib/supabase';
import { isAdmin } from '@/lib/session';

export const runtime = 'nodejs';

const OK_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Gives the admin page a one-time link to upload a photo straight to Supabase Storage.
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ext = OK_TYPES[body.type];
  if (!ext) return NextResponse.json({ error: 'type' }, { status: 400 });
  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: pub } = client.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return NextResponse.json({ path, token: data.token, publicUrl: pub.publicUrl });
}

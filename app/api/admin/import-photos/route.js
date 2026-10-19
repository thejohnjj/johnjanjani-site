import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, PHOTO_BUCKET } from '@/lib/supabase';
import { isAdmin } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 60;

const OK_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 12 * 1024 * 1024;

function safeUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    if (u.protocol !== 'https:') return null;
    const h = u.hostname;
    // Public web hosts only.
    if (h === 'localhost' || /^[\d.]+$/.test(h) || h.includes(':') || !h.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function copyOne(client, url) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const ext = OK_TYPES[type];
  if (!ext) throw new Error('not a JPG, PNG or WebP image');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('larger than 12 MB');
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, buf, { contentType: type });
  if (error) throw new Error(error.message);
  return client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Copies photos from web links into the site's own photo storage, in the order given.
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const urls = (Array.isArray(body.urls) ? body.urls : []).map(safeUrl).filter(Boolean).slice(0, 60);
  if (!urls.length) return NextResponse.json({ error: 'Paste at least one https photo link.' }, { status: 400 });
  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });

  const results = new Array(urls.length);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      try {
        results[i] = { ok: true, url: await copyOne(client, urls[i]) };
      } catch (e) {
        results[i] = { ok: false, source: urls[i], error: e.message };
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  return NextResponse.json({
    photos: results.filter((r) => r.ok).map((r) => r.url),
    failed: results.filter((r) => !r.ok),
  });
}

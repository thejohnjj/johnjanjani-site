import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { feedToken } from '@/lib/proptx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Returns the feed's schema (resource and field names/types) only — no listing records.
export async function GET(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const kind = new URL(req.url).searchParams.get('kind') === 'vow' ? 'vow' : 'idx';
  const want = (new URL(req.url).searchParams.get('types') || 'Property,Media').split(',');
  const res = await fetch('https://query.ampre.ca/odata/$metadata', {
    headers: { Authorization: `Bearer ${feedToken(kind)}`, Accept: 'application/xml' },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json({ status: res.status });
  const xml = await res.text();
  const types = [...xml.matchAll(/<EntityType\b[^>]*Name="([^"]+)"/g)].map((m) => m[1]);
  const sets = [...xml.matchAll(/<EntitySet Name="([^"]+)"/g)].map((m) => m[1]);
  const out = { status: res.status, types, sets, size: xml.length, fields: {} };
  for (const t of want) {
    const m = xml.match(new RegExp(`<EntityType\\b[^>]*Name="${t}"[\\s\\S]*?</EntityType>`));
    if (!m) continue;
    out.fields[t] = [...m[0].matchAll(/<(?:Property|NavigationProperty)\b[^>]*>/g)].map((p) => {
      const name = (p[0].match(/Name="([^"]+)"/) || [])[1];
      const type = (p[0].match(/Type="([^"]+)"/) || [])[1] || '';
      return `${name}:${type.replace('Edm.', '')}`;
    });
  }
  return NextResponse.json(out);
}

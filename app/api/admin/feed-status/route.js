import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { feedGet, feedToken } from '@/lib/proptx';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Connection check only: returns status codes and record counts, never listing content.
async function count(kind, filter) {
  const q = 'Property?$count=true&$top=0' + (filter ? '&$filter=' + encodeURIComponent(filter) : '');
  const r = await feedGet(q, { kind, revalidate: 0 });
  return { status: r.status, count: r.ok ? r.data['@odata.count'] ?? null : null };
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const out = {};
  for (const kind of ['idx', 'vow']) {
    if (!feedToken(kind)) { out[kind] = 'no token'; continue; }
    out[kind] = {
      all: await count(kind),
      available: await count(kind, "ContractStatus eq 'Available'"),
    };
  }
  const client = db();
  if (client) {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count, error } = await client.from('feed_audit').select('id', { count: 'exact', head: true }).gte('at', since);
    out.auditLast24h = error ? { error: error.message } : count;
  }
  return NextResponse.json(out);
}

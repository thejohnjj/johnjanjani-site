import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { feedGet } from '@/lib/proptx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Reference data only: allowed values of a field (e.g. PropertySubType), and record counts.
// Never returns listing records.
export async function GET(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const kind = sp.get('kind') === 'vow' ? 'vow' : 'idx';
  const names = (sp.get('names') || '').split(',').filter((n) => /^[A-Za-z0-9]+$/.test(n));
  const out = {};
  for (const n of names) {
    const r = await feedGet(`Lookup?$filter=${encodeURIComponent(`LookupName eq '${n}'`)}&$select=LookupValue&$top=500`, { kind, revalidate: 0 });
    out[n] = r.ok ? (r.data.value || []).map((v) => v.LookupValue) : { status: r.status };
  }
  const m = await feedGet('Media?$count=true&$top=0', { kind, revalidate: 0 });
  out._mediaCount = m.ok ? m.data['@odata.count'] : { status: m.status };
  return NextResponse.json(out);
}

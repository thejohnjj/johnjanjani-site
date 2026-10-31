import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { readSoldFilters, searchSold, marketSnapshot, getVowListing, getAddressHistory, getPriceChanges } from '@/lib/vow-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Health check for the sold-data code. Returns only counts, ratios, timings and true/false —
// never prices, addresses, keys or any other listing content.
export async function GET(req) {
  try {
    return await run(req);
  } catch (e) {
    return NextResponse.json({ crash: String(e?.message || e).slice(0, 300), where: String(e?.stack || '').split('\n').slice(0, 4).join(' | ').slice(0, 400) });
  }
}

async function run(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = readSoldFilters(sp);
  const out = {};
  let t = Date.now();
  const s = await searchSold(f);
  const n = s.items.length || 1;
  const share = (fn) => Math.round((s.items.filter(fn).length / n) * 100) + '%';
  out.search = { ok: s.ok, status: s.status, error: s.error, ms: Date.now() - t, total: s.total, returned: s.items.length,
    withSoldPrice: share((i) => i.soldPrice), withPhoto: share((i) => i.photo), withDate: share((i) => i.soldDate), withStreet: share((i) => i.street?.number), withBrokerage: share((i) => i.brokerage) };
  t = Date.now();
  const m = await marketSnapshot(f);
  out.snapshot = m ? { ms: Date.now() - t, enough: m.enough, sample: m.sample, hasMedian: Boolean(m.median), hasRatio: m.ratio != null, hasDom: m.dom != null } : 'failed';
  const first = s.items.find((i) => i.street?.number) || s.items[0];
  if (first) {
    t = Date.now();
    const d = await getVowListing(first.key);
    out.detail = d && !d.error ? { ms: Date.now() - t, photos: d.photos.length, facts: d.facts.length, hasRemarks: Boolean(d.remarks), hasSold: Boolean(d.soldPrice) } : { error: d?.error ?? 'none' };
    t = Date.now();
    const h = await getAddressHistory(first);
    out.history = { ms: Date.now() - t, entries: h.length, statuses: [...new Set(h.map((x) => x.status))] };
    t = Date.now();
    const pc = await getPriceChanges(first.key);
    out.priceChanges = { ms: Date.now() - t, entries: pc.length };
  }
  return NextResponse.json(out);
}

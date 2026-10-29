import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { readFilters, searchListings, getFeedListing, searchPath, feedGet, buildFilter } from '@/lib/proptx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Health check for the search code. Returns only counts, ratios, hosts and status codes —
// never addresses, prices, remarks, keys or any other listing content.
export async function GET(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = readFilters(sp);
  if (sp.steps) {
    const flt = encodeURIComponent(buildFilter(f));
    const full = searchPath(f);
    const base = `Property?$top=2&$filter=${flt}&$select=ListingKey`;
    const M = "ImageSizeDescription eq 'Medium' and MediaStatus eq 'Active'";
    const variants = {
      fActive: base + '&$expand=' + encodeURIComponent(`Media($filter=${M})`),
      fPreferred: base + '&$expand=' + encodeURIComponent(`Media($filter=${M} and PreferredPhotoYN eq true)`),
      fTop: base + '&$expand=' + encodeURIComponent(`Media($filter=${M};$top=1)`),
      fOrder: base + '&$expand=' + encodeURIComponent(`Media($filter=${M};$orderby=Order)`),
      fLargeActive: base + '&$expand=' + encodeURIComponent("Media($filter=ImageSizeDescription eq 'Large' and MediaStatus eq 'Active')"),
      fLargestActive: base + '&$expand=' + encodeURIComponent("Media($filter=ImageSizeDescription eq 'Largest' and MediaStatus eq 'Active')"),
      top24: `Property?$top=24&$filter=${flt}&$select=ListingKey&$expand=` + encodeURIComponent(`Media($filter=${M} and PreferredPhotoYN eq true)`),
    };
    const res = {};
    for (const [k, v] of Object.entries(variants)) {
      const r = await feedGet(v, { revalidate: 0 });
      res[k] = { ok: r.ok, status: r.status, error: r.error, rows: r.ok ? (r.data.value || []).length : null, count: r.ok ? r.data['@odata.count'] : null,
        mediaPerRow: r.ok ? (r.data.value || []).map((x) => (x.Media ? x.Media.length : null)) : null,
        orders: r.ok ? (r.data.value || []).slice(0, 2).map((x) => (x.Media || []).slice(0, 12).map((m) => m.Order)) : null,
        preferredFlags: r.ok ? (r.data.value || []).slice(0, 2).map((x) => (x.Media || []).filter((m) => m.PreferredPhotoYN).length) : null };
    }
    return NextResponse.json(res);
  }
  const t0 = Date.now();
  const s = await searchListings(f);
  const ms = Date.now() - t0;
  const n = s.items.length || 1;
  const share = (fn) => Math.round((s.items.filter(fn).length / n) * 100) + '%';
  const out = {
    search: { ok: s.ok, status: s.status, error: s.error, ms, total: s.total, returned: s.items.length,
      withPhoto: share((i) => i.photo), withLatLng: share((i) => i.lat && i.lng), withBrokerage: share((i) => i.brokerage),
      photoHosts: [...new Set(s.items.map((i) => i.photo && new URL(i.photo).host).filter(Boolean))] },
  };
  const first = s.items.find((i) => i.photo);
  if (first) {
    const img = await fetch(first.photo, { method: 'GET', headers: { Range: 'bytes=0-0' } }).catch(() => null);
    out.photoFetch = img ? { status: img.status, type: img.headers.get('content-type') } : 'failed';
    const t1 = Date.now();
    const d = await getFeedListing(first.key);
    out.detail = d && !d.error
      ? { ok: true, ms: Date.now() - t1, photos: d.photos.length, hasRemarks: Boolean(d.remarks), facts: d.facts.length, hasTour: Boolean(d.tour) }
      : { ok: false, error: d?.error ?? 'not found' };
  }
  return NextResponse.json(out);
}

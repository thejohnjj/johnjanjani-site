// Sold data from the PropTx VOW feed. Only for signed-in VOW members (see lib/vow.js).
// Rules enforced here:
//  - listings whose sellers withheld internet display are never shown (InternetEntireListingDisplayYN),
//    and withheld addresses stay hidden (InternetAddressDisplayYN)
//  - "do not disclose until closing" prices stay hidden until the closing date
//  - seller opt-outs from automated estimates / display (table vow_suppress) are excluded
//  - at most 100 listings per inquiry; numbers come from plain arithmetic, never from AI
import 'server-only';
import { unstable_cache } from 'next/cache';
import { feedGet, TYPES, AREAS, MAX_RESULTS, PAGE_SIZE } from '@/lib/proptx';
import { db } from '@/lib/supabase';

const KIND = 'vow';
const q = (s) => String(s).replace(/'/g, "''");
const int = (v, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const iso = (d) => new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');
const monthsAgo = (n) => iso(Date.now() - n * 30.44 * 86400000);

export const getSuppressed = unstable_cache(
  async () => {
    const client = db();
    if (!client) return [];
    const { data, error } = await client.from('vow_suppress').select('listing_key');
    return error ? [] : (data || []).map((r) => r.listing_key);
  },
  ['vow-suppress-v1'],
  { revalidate: 600, tags: ['vow-suppress'] }
);

const SOLD_SORTS = {
  recent: (deal) => `${deal === 'lease' ? 'LeasedEntryTimestamp' : 'SoldEntryTimestamp'} desc,ListingKey desc`,
  high: () => 'ClosePrice desc,ListingKey desc',
  low: () => 'ClosePrice asc,ListingKey asc',
};

export function readSoldFilters(sp = {}) {
  const get = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || '';
  let area = AREAS.includes(get('area')) ? get('area') : '';
  let kw = get('q').replace(/[^\p{L}\p{N}\s'.-]/gu, '').trim().slice(0, 40);
  const typedArea = AREAS.find((a) => a.toLowerCase() === kw.toLowerCase());
  if (typedArea && !area) {
    area = typedArea;
    kw = '';
  }
  return {
    deal: get('deal') === 'lease' ? 'lease' : 'sale',
    area,
    q: kw,
    type: TYPES[get('type')] ? get('type') : '',
    beds: int(get('beds'), 1, 9),
    baths: int(get('baths'), 1, 9),
    months: [1, 3, 6, 12, 24].includes(int(get('months'), 1, 24)) ? int(get('months'), 1, 24) : 6,
    sort: SOLD_SORTS[get('sort')] ? get('sort') : 'recent',
    page: int(get('page'), 1, Math.ceil(MAX_RESULTS / PAGE_SIZE)) || 1,
  };
}

function soldFilter(f, suppressed = []) {
  const dateField = f.deal === 'lease' ? 'LeasedEntryTimestamp' : 'SoldEntryTimestamp';
  const parts = [
    f.deal === 'lease' ? "MlsStatus eq 'Leased'" : "MlsStatus eq 'Sold'",
    'InternetEntireListingDisplayYN eq true',
    'ClosePrice gt 0',
    `${dateField} ge ${monthsAgo(f.months)}`,
  ];
  if (f.area === 'Toronto') parts.push("startswith(City,'Toronto')");
  else if (f.area) parts.push(`City eq '${q(f.area)}'`);
  if (f.community) parts.push(`CityRegion eq '${q(f.community)}'`);
  if (f.type) parts.push(`(${TYPES[f.type].join(' or ')})`);
  if (f.beds) parts.push(`BedroomsTotal ge ${f.beds}`);
  if (f.baths) parts.push(`BathroomsTotalInteger ge ${f.baths}`);
  if (f.q) {
    const variants = [...new Set([f.q, titleCase(f.q), f.q.toUpperCase()])].map(q);
    parts.push(`(${variants.flatMap((v) => [`contains(UnparsedAddress,'${v}')`, `contains(CityRegion,'${v}')`, `ListingKey eq '${v}'`]).join(' or ')})`);
  }
  for (const k of suppressed.slice(0, 50)) parts.push(`ListingKey ne '${q(k)}'`);
  return parts.join(' and ');
}

const SOLD_FIELDS = [
  'ListingKey', 'ListPrice', 'OriginalListPrice', 'ClosePrice', 'CloseDate', 'SoldEntryTimestamp', 'LeasedEntryTimestamp',
  'DoNotDiscloseUntilClosingYN', 'MlsStatus', 'TransactionType', 'DaysOnMarket', 'UnparsedAddress', 'InternetAddressDisplayYN',
  'City', 'CityRegion', 'PropertySubType', 'BedroomsAboveGrade', 'BedroomsBelowGrade', 'BedroomsTotal', 'BathroomsTotalInteger',
  'ParkingTotal', 'LivingAreaRange', 'ListOfficeName', 'StreetNumber', 'StreetName', 'UnitNumber',
];
const cardPhoto = encodeURIComponent("Media($filter=ImageSizeDescription eq 'Medium' and MediaStatus eq 'Active' and PreferredPhotoYN eq true)");
const allPhotos = encodeURIComponent("Media($filter=ImageSizeDescription eq 'Large' and MediaStatus eq 'Active';$orderby=Order)");

const today = () => new Date().toISOString().slice(0, 10);

// One sold/leased listing as a card. The sold price is hidden while "do not disclose until closing" applies.
export function toSoldCard(p) {
  const showAddress = p.InternetAddressDisplayYN !== false;
  const lease = p.MlsStatus === 'Leased' || p.TransactionType === 'For Lease';
  const hold = p.DoNotDiscloseUntilClosingYN === true && (!p.CloseDate || p.CloseDate > today());
  const soldAt = lease ? p.LeasedEntryTimestamp : p.SoldEntryTimestamp;
  return {
    key: p.ListingKey,
    status: p.MlsStatus,
    lease,
    soldPrice: hold ? null : p.ClosePrice || null,
    held: hold,
    soldDate: soldAt ? String(soldAt).slice(0, 10) : null,
    listPrice: p.ListPrice || null,
    originalPrice: p.OriginalListPrice || null,
    ratio: !hold && p.ClosePrice && p.ListPrice ? Math.round((p.ClosePrice / p.ListPrice) * 1000) / 10 : null,
    dom: p.DaysOnMarket ?? null,
    address: showAddress ? p.UnparsedAddress : null,
    city: p.City,
    community: p.CityRegion,
    subtype: p.PropertySubType,
    bedsAbove: p.BedroomsAboveGrade,
    bedsBelow: p.BedroomsBelowGrade,
    beds: p.BedroomsTotal,
    baths: p.BathroomsTotalInteger,
    parking: p.ParkingTotal,
    sqft: p.LivingAreaRange,
    brokerage: p.ListOfficeName,
    street: showAddress ? { number: p.StreetNumber, name: p.StreetName, unit: p.UnitNumber } : null,
    photo: (p.Media || [])[0]?.MediaURL || null,
  };
}

export async function searchSold(f) {
  if ((f.page - 1) * PAGE_SIZE >= MAX_RESULTS) return { ok: true, total: 0, items: [] };
  const skip = (f.page - 1) * PAGE_SIZE;
  const top = Math.min(PAGE_SIZE, MAX_RESULTS - skip);
  const suppressed = await getSuppressed();
  const path =
    'Property?$count=true' +
    `&$filter=${encodeURIComponent(soldFilter(f, suppressed))}` +
    `&$select=${SOLD_FIELDS.join(',')}` +
    `&$orderby=${encodeURIComponent(SOLD_SORTS[f.sort](f.deal))}` +
    `&$top=${top}&$skip=${skip}&$expand=${cardPhoto}`;
  const r = await feedGet(path, { kind: KIND, revalidate: 3600 });
  if (!r.ok) return { ok: false, status: r.status, error: r.error, total: 0, items: [] };
  return { ok: true, total: r.data['@odata.count'] ?? 0, items: (r.data.value || []).map(toSoldCard) };
}

// ---------- market snapshot (derived statistics, allowed on the VOW) ----------

const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (a, p) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
};

// Pulls up to `limit` sales (no photos) for statistics, following the feed's paging links.
async function pullForStats(filter, orderby, limit = 400) {
  const rows = [];
  let path = `Property?$count=true&$filter=${encodeURIComponent(filter)}&$select=${SOLD_FIELDS.join(',')}&$orderby=${encodeURIComponent(orderby)}&$top=200`;
  let total = 0;
  for (let i = 0; i < 4 && path && rows.length < limit; i++) {
    const r = await feedGet(path, { kind: KIND, revalidate: 3600 });
    if (!r.ok) return { ok: false, rows, total };
    if (i === 0) total = r.data['@odata.count'] ?? 0;
    rows.push(...(r.data.value || []));
    const next = r.data['@odata.nextLink'];
    path = next ? next.replace(/^https?:\/\/[^/]+\/odata\//, '') : null;
  }
  return { ok: true, rows: rows.slice(0, limit), total };
}

export async function marketSnapshot(f) {
  const g = { ...f, months: Math.min(f.months, 3), q: '', page: 1 };
  const suppressed = await getSuppressed();
  const r = await pullForStats(soldFilter(g, suppressed), SOLD_SORTS.recent(g.deal), 400);
  if (!r.ok) return null;
  const cards = r.rows.map(toSoldCard).filter((c) => c.soldPrice);
  if (cards.length < 5) return { count: r.total, months: g.months, enough: false };
  const prices = cards.map((c) => c.soldPrice);
  const ratios = cards.map((c) => c.ratio).filter((x) => x && x > 50 && x < 200);
  const doms = cards.map((c) => c.dom).filter((x) => Number.isFinite(x));
  return {
    enough: true,
    months: g.months,
    count: r.total,
    sample: cards.length,
    median: Math.round(median(prices)),
    low: Math.round(pct(prices, 0.25)),
    high: Math.round(pct(prices, 0.75)),
    ratio: ratios.length ? Math.round(median(ratios) * 10) / 10 : null,
    overAsking: ratios.length ? Math.round((ratios.filter((x) => x > 100).length / ratios.length) * 100) : null,
    dom: doms.length ? Math.round(median(doms)) : null,
  };
}

// ---------- one listing with sold details ----------

const DETAIL_FIELDS = [
  ...SOLD_FIELDS, 'PublicRemarks', 'TaxAnnualAmount', 'TaxYear', 'AssociationFee', 'AssociationFeeIncludes', 'ApproximateAge',
  'Basement', 'HeatType', 'Cooling', 'GarageType', 'LotWidth', 'LotDepth', 'LotSizeUnits', 'Exposure', 'Locker', 'PetsAllowed',
  'CrossStreet', 'KitchensTotal', 'ArchitecturalStyle', 'ConstructionMaterials', 'Furnished', 'VirtualTourURLUnbranded',
  'ContractStatus', 'InternetEntireListingDisplayYN', 'OriginalEntryTimestamp', 'TerminatedDate', 'ExpirationDate', 'StandardStatus',
];

export async function getVowListing(key) {
  if (!/^[A-Za-z0-9-]{4,20}$/.test(key || '')) return null;
  if ((await getSuppressed()).includes(key)) return null;
  const path = `Property?$filter=${encodeURIComponent(`ListingKey eq '${q(key)}'`)}&$select=${DETAIL_FIELDS.join(',')}&$top=1&$expand=${allPhotos}`;
  const r = await feedGet(path, { kind: KIND, revalidate: 900 });
  if (!r.ok) return { error: r.status };
  const p = (r.data.value || [])[0];
  if (!p || p.InternetEntireListingDisplayYN === false) return null;
  const card = toSoldCard(p);
  const seen = new Set();
  const photos = [];
  for (const m of p.Media || []) {
    if (!m.MediaURL || seen.has(m.Order)) continue;
    seen.add(m.Order);
    photos.push(m.MediaURL);
  }
  const listFacts = (v) => (Array.isArray(v) && v.length ? v.join(', ') : null);
  return {
    ...card,
    available: p.ContractStatus === 'Available',
    remarks: p.PublicRemarks || '',
    photos,
    listedDate: p.OriginalEntryTimestamp ? String(p.OriginalEntryTimestamp).slice(0, 10) : null,
    tour: /^https:\/\//.test(p.VirtualTourURLUnbranded || '') ? p.VirtualTourURLUnbranded : null,
    facts: [
      ['taxes', p.TaxAnnualAmount ? `$${Number(p.TaxAnnualAmount).toLocaleString('en-US')}${p.TaxYear ? ` (${p.TaxYear})` : ''}` : null],
      ['fee', p.AssociationFee ? `$${Number(p.AssociationFee).toLocaleString('en-US')}` : null],
      ['feeIncludes', listFacts(p.AssociationFeeIncludes)],
      ['style', listFacts(p.ArchitecturalStyle)],
      ['age', p.ApproximateAge],
      ['basement', listFacts(p.Basement)],
      ['heat', p.HeatType],
      ['cooling', listFacts(p.Cooling)],
      ['garage', p.GarageType],
      ['lot', p.LotWidth && p.LotDepth ? `${p.LotWidth} x ${p.LotDepth}${p.LotSizeUnits ? ` ${p.LotSizeUnits}` : ''}` : null],
      ['exposure', p.Exposure],
      ['locker', p.Locker],
      ['pets', listFacts(p.PetsAllowed)],
      ['furnished', p.Furnished],
      ['exterior', listFacts(p.ConstructionMaterials)],
      ['kitchens', p.KitchensTotal],
      ['cross', p.CrossStreet],
      ['dom', p.DaysOnMarket],
    ].filter(([, v]) => v !== null && v !== undefined && v !== ''),
  };
}

// Every listing of the same address (same street number, street, unit and city): the home's MLS® history.
export async function getAddressHistory(card) {
  const s = card?.street;
  if (!s?.number || !s?.name || !card.city) return [];
  const parts = [`StreetNumber eq '${q(s.number)}'`, `StreetName eq '${q(s.name)}'`, `City eq '${q(card.city)}'`, 'InternetEntireListingDisplayYN eq true'];
  parts.push(s.unit ? `UnitNumber eq '${q(s.unit)}'` : 'UnitNumber eq null');
  const fields = ['ListingKey', 'MlsStatus', 'TransactionType', 'ListPrice', 'OriginalListPrice', 'ClosePrice', 'CloseDate', 'DoNotDiscloseUntilClosingYN',
    'OriginalEntryTimestamp', 'SoldEntryTimestamp', 'LeasedEntryTimestamp', 'TerminatedDate', 'ExpirationDate', 'DaysOnMarket', 'ListOfficeName', 'ContractStatus'];
  const path = `Property?$filter=${encodeURIComponent(parts.join(' and '))}&$select=${fields.join(',')}&$orderby=${encodeURIComponent('OriginalEntryTimestamp desc')}&$top=25`;
  const r = await feedGet(path, { kind: KIND, revalidate: 3600 });
  if (!r.ok) return [];
  const suppressed = await getSuppressed();
  return (r.data.value || [])
    .filter((p) => !suppressed.includes(p.ListingKey))
    .map((p) => {
      const hold = p.DoNotDiscloseUntilClosingYN === true && (!p.CloseDate || p.CloseDate > today());
      const lease = p.TransactionType === 'For Lease' || p.MlsStatus === 'Leased';
      const end = p.MlsStatus === 'Sold' ? p.SoldEntryTimestamp : p.MlsStatus === 'Leased' ? p.LeasedEntryTimestamp : p.MlsStatus === 'Terminated' ? p.TerminatedDate : p.MlsStatus === 'Expired' ? p.ExpirationDate : null;
      return {
        key: p.ListingKey,
        status: p.ContractStatus === 'Available' ? 'Active' : p.MlsStatus,
        lease,
        listed: p.OriginalEntryTimestamp ? String(p.OriginalEntryTimestamp).slice(0, 10) : null,
        ended: end ? String(end).slice(0, 10) : null,
        originalPrice: p.OriginalListPrice || p.ListPrice || null,
        listPrice: p.ListPrice || null,
        soldPrice: hold ? null : p.ClosePrice || null,
        dom: p.DaysOnMarket ?? null,
        brokerage: p.ListOfficeName,
      };
    });
}

// Price changes during one listing, from the feed's change history (if the feed provides it).
export async function getPriceChanges(key) {
  const f = `ResourceRecordKey eq '${q(key)}' and FieldName eq 'ListPrice'`;
  const r = await feedGet(`HistoryTransactional?$filter=${encodeURIComponent(f)}&$select=PreviousValue,NewValue,ModificationTimestamp&$orderby=ModificationTimestamp asc&$top=30`, { kind: KIND, revalidate: 3600 });
  if (!r.ok) return [];
  return (r.data.value || [])
    .map((h) => ({ date: String(h.ModificationTimestamp || '').slice(0, 10), from: Number(h.PreviousValue) || null, to: Number(h.NewValue) || null }))
    .filter((h) => h.to && h.from && h.to !== h.from);
}

export { soldFilter, pullForStats, median, pct, SOLD_SORTS, KIND };

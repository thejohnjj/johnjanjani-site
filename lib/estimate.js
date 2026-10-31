// Instant home value from comparable sales in the VOW feed. Plain statistics only (no AI):
// the estimate is the median price of the most similar recent sales, the range is their middle 50%.
// Members-only (VOW): never call this for a visitor without VOW access.
import 'server-only';
import { feedGet, TYPES, AREAS } from '@/lib/proptx';
import { getSuppressed, toSoldCard, median, pct, KIND, pullForStats, getAddressHistory } from '@/lib/vow-data';

const q = (s) => String(s).replace(/'/g, "''");
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const monthsAgo = (n) => iso(Date.now() - n * 30.44 * 86400000);

export const SIZES = {
  '<700': ['< 700', '0-499', '500-599', '600-699'],
  '700-999': ['700-799', '800-899', '900-999', '700-1100'],
  '1000-1399': ['1000-1199', '1200-1399', '1100-1500'],
  '1400-1999': ['1400-1599', '1600-1799', '1800-1999', '1500-2000'],
  '2000-2499': ['2000-2249', '2250-2499', '2000-2500'],
  '2500-2999': ['2500-2749', '2750-2999', '2500-3000'],
  '3000-3499': ['3000-3249', '3250-3499', '3000-3500'],
  '3500+': ['3500-3749', '3750-3999', '3500-5000', '4000-4249', '4250-4499', '4500-4749', '4750-4999', '5000 +'],
};

const SUFFIX = /\s+(street|st|avenue|ave|av|road|rd|drive|dr|crescent|cres|cr|court|crt|ct|boulevard|blvd|lane|ln|way|place|pl|circle|cir|trail|trl|terrace|terr|gate|gardens|gdns|square|sq|parkway|pkwy|heights|hts|grove|grv|path|row|mews|hill|valley|view|ridge|park|walk|close|common|line|landing|manor|run|point|pt|glen)\.?$/i;
const DIRS = /\s+(north|south|east|west|n|s|e|w)\.?$/i;

export function readEstimateInput(sp = {}) {
  const get = (k) => String((Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || '').trim();
  const addr = get('addr').replace(/[^\p{L}\p{N}\s'.#-]/gu, '').slice(0, 80);
  const m = addr.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  let name = m ? m[2] : '';
  name = name.replace(DIRS, '').replace(SUFFIX, '').replace(DIRS, '').trim();
  const titled = name.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (x, a, b) => a + b.toUpperCase());
  const n = (k, lo, hi) => {
    const v = parseInt(get(k), 10);
    return Number.isFinite(v) && v >= lo && v <= hi ? v : null;
  };
  // A listing page passes the feed's exact city ("Toronto C07", "Innisfil"...) so homes outside the area list work too.
  const areaIn = AREAS.includes(get('area')) ? get('area') : '';
  let city = /^[\p{L}\p{N} .'/-]{2,40}$/u.test(get('city')) ? get('city') : '';
  // If the member picked a different area in the form, their choice wins over the listing's city.
  if (areaIn && city && !city.startsWith(areaIn)) city = '';
  const area = areaIn || (city.startsWith('Toronto') ? 'Toronto' : AREAS.includes(city) ? city : '');
  return {
    addr,
    number: m ? m[1] : '',
    street: titled,
    unit: get('unit').replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 10),
    area,
    city,
    exclude: /^[A-Za-z0-9-]{4,20}$/.test(get('key')) ? get('key') : '',
    purpose: get('purpose') === 'interested' ? 'interested' : 'mine',
    type: TYPES[get('type')] ? get('type') : '',
    beds: n('beds', 0, 8),
    baths: n('baths', 1, 8),
    size: SIZES[get('size')] ? get('size') : '',
  };
}

export function inputComplete(i) {
  return Boolean(i.number && i.street && (i.area || i.city) && i.type && i.beds != null);
}

const FIELDS = [
  'ListingKey', 'ListPrice', 'OriginalListPrice', 'ClosePrice', 'CloseDate', 'SoldEntryTimestamp', 'LeasedEntryTimestamp',
  'DoNotDiscloseUntilClosingYN', 'MlsStatus', 'TransactionType', 'DaysOnMarket', 'UnparsedAddress', 'InternetAddressDisplayYN',
  'City', 'CityRegion', 'PropertySubType', 'BedroomsAboveGrade', 'BedroomsBelowGrade', 'BedroomsTotal', 'BathroomsTotalInteger',
  'ParkingTotal', 'LivingAreaRange', 'ListOfficeName', 'StreetNumber', 'StreetName', 'UnitNumber',
];
const cardPhoto = encodeURIComponent("Media($filter=ImageSizeDescription eq 'Medium' and MediaStatus eq 'Active' and PreferredPhotoYN eq true)");

function cityClause(area, city) {
  if (city) return `City eq '${q(city)}'`;
  return area === 'Toronto' ? "startswith(City,'Toronto')" : `City eq '${q(area)}'`;
}

// Which community (and, for Toronto, which district) the street is in, from past listings on that street.
async function locate(i) {
  const f = [`StreetName eq '${q(i.street)}'`, i.city ? cityClause('', i.city) : cityClause(i.area)].join(' and ');
  const r = await feedGet(`Property?$filter=${encodeURIComponent(f)}&$select=City,CityRegion,StreetNumber&$top=100`, { kind: KIND, revalidate: 86400 });
  if (!r.ok) return {};
  const rows = r.data.value || [];
  const pick = (list) => {
    const c = {};
    for (const x of list) if (x) c[x] = (c[x] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  };
  const near = rows.filter((x) => x.StreetNumber && Math.abs(parseInt(x.StreetNumber, 10) - parseInt(i.number, 10)) <= 200);
  const base = near.length >= 3 ? near : rows;
  return { city: pick(base.map((x) => x.City)), community: pick(base.map((x) => x.CityRegion)), streetFound: rows.length > 0 };
}

function bedsClause(i) {
  if (i.type === 'condo') return i.beds === 0 ? 'BedroomsAboveGrade eq 0' : `BedroomsAboveGrade eq ${i.beds}`;
  const lo = Math.max(1, i.beds - 1);
  return `BedroomsAboveGrade ge ${lo} and BedroomsAboveGrade le ${i.beds + 1}`;
}

async function pull(parts, suppressed, top = 100, exclude = '') {
  const f = ["MlsStatus eq 'Sold'", "TransactionType eq 'For Sale'", 'InternetEntireListingDisplayYN eq true', 'ClosePrice gt 0', ...parts];
  for (const k of suppressed.slice(0, 50)) f.push(`ListingKey ne '${q(k)}'`);
  if (exclude) f.push(`ListingKey ne '${q(exclude)}'`);
  const path = `Property?$count=true&$filter=${encodeURIComponent(f.join(' and '))}&$select=${FIELDS.join(',')}&$orderby=${encodeURIComponent('SoldEntryTimestamp desc')}&$top=${top}&$expand=${cardPhoto}`;
  const r = await feedGet(path, { kind: KIND, revalidate: 3600 });
  if (!r.ok) return { ok: false, rows: [], total: 0 };
  return { ok: true, rows: (r.data.value || []).map(toSoldCard).filter((c) => c.soldPrice), total: r.data['@odata.count'] ?? 0 };
}

// Similarity score used to pick the comparables we show (higher is closer).
function score(c, i, loc) {
  let s = 0;
  if (c.street && c.street.name === i.street) s += 30;
  if (c.community && c.community === loc.community) s += 15;
  if (i.type === 'condo' ? c.bedsAbove === i.beds : c.bedsAbove === i.beds) s += 12;
  if (i.baths && c.baths === i.baths) s += 6;
  if (i.size && SIZES[i.size].includes(c.sqft)) s += 12;
  const ageDays = c.soldDate ? (Date.now() - new Date(c.soldDate).getTime()) / 86400000 : 365;
  s += Math.max(0, 12 - ageDays / 30);
  return s;
}

export async function estimateValue(i) {
  const suppressed = await getSuppressed();
  const loc = await locate(i);
  if (!loc.streetFound) return { ok: false, reason: 'street', location: loc };
  const type = `(${TYPES[i.type].join(' or ')})`;
  const city = cityClause(i.area, loc.city || i.city);
  const wide = i.area === 'Toronto' ? cityClause('Toronto') : cityClause(i.area, i.city || loc.city);
  const ladder = [];
  if (i.type === 'condo' || i.type === 'town') {
    // Same building first.
    ladder.push({ level: 'building', months: 12, parts: [type, city, `StreetNumber eq '${q(i.number)}'`, `StreetName eq '${q(i.street)}'`, bedsClause(i), `SoldEntryTimestamp ge ${monthsAgo(12)}`] });
  }
  if (loc.community) {
    if (i.size) ladder.push({ level: 'community', months: 6, parts: [type, city, `CityRegion eq '${q(loc.community)}'`, bedsClause(i), `(${SIZES[i.size].map((x) => `LivingAreaRange eq '${q(x)}'`).join(' or ')})`, `SoldEntryTimestamp ge ${monthsAgo(6)}`] });
    ladder.push({ level: 'community', months: 6, parts: [type, city, `CityRegion eq '${q(loc.community)}'`, bedsClause(i), `SoldEntryTimestamp ge ${monthsAgo(6)}`] });
    ladder.push({ level: 'community', months: 12, parts: [type, city, `CityRegion eq '${q(loc.community)}'`, bedsClause(i), `SoldEntryTimestamp ge ${monthsAgo(12)}`] });
  }
  ladder.push({ level: 'city', months: 6, parts: [type, city, bedsClause(i), `SoldEntryTimestamp ge ${monthsAgo(6)}`] });
  ladder.push({ level: 'city', months: 12, parts: [type, wide, `SoldEntryTimestamp ge ${monthsAgo(12)}`] });

  let used = null;
  let res = null;
  for (const step of ladder) {
    const r = await pull(step.parts, suppressed, 100, i.exclude);
    if (!r.ok) continue;
    if (r.rows.length >= (step.level === 'building' ? 4 : 6)) {
      used = step;
      res = r;
      break;
    }
  }
  if (!res) return { ok: false, reason: 'few', location: loc };

  const prices = res.rows.map((c) => c.soldPrice);
  const mid = median(prices);
  let low = pct(prices, 0.25);
  let high = pct(prices, 0.75);
  if (high - low < mid * 0.08) {
    low = mid * 0.95;
    high = mid * 1.05;
  }
  const round = (n) => Math.round(n / 5000) * 5000;
  const confidence = used.level === 'building' || (used.level === 'community' && res.rows.length >= 10 && used.months === 6) ? 'high' : used.level === 'community' ? 'medium' : 'low';
  const comps = [...res.rows].sort((a, b) => score(b, i, loc) - score(a, i, loc)).slice(0, 6);
  return {
    ok: true,
    value: round(mid),
    low: round(low),
    high: round(high),
    confidence,
    level: used.level,
    months: used.months,
    count: res.rows.length,
    total: res.total,
    location: loc,
    comps,
    compsAll: res.rows,
  };
}

// ---------- full report (all plain arithmetic on MLS® sales) ----------


const mid = (range) => {
  if (!range) return null;
  if (/^</.test(range)) return 600;
  if (/\+/.test(range)) return 5500;
  const m = String(range).match(/(\d+)\s*-\s*(\d+)/);
  return m ? (Number(m[1]) + Number(m[2])) / 2 : null;
};
const SIZE_MID = { '<700': 600, '700-999': 850, '1000-1399': 1200, '1400-1999': 1700, '2000-2499': 2250, '2500-2999': 2750, '3000-3499': 3250, '3500+': 4000 };
const ym = (d) => String(d || '').slice(0, 7);
const round5k = (n) => Math.round(n / 5000) * 5000;

function areaParts(i, loc, community = true) {
  const parts = [`(${TYPES[i.type].join(' or ')})`, cityClause(i.area, loc.city || i.city)];
  if (community && loc.community) parts.push(`CityRegion eq '${q(loc.community)}'`);
  return parts;
}

// Monthly median sold price over the last 24 months for this home type in the community (or city).
async function priceTrend(i, loc, suppressed) {
  const tryLevel = async (community) => {
    const f = ["MlsStatus eq 'Sold'", "TransactionType eq 'For Sale'", 'InternetEntireListingDisplayYN eq true', 'ClosePrice gt 0', `SoldEntryTimestamp ge ${monthsAgo(24)}`, ...areaParts(i, loc, community)];
    for (const k of suppressed.slice(0, 50)) f.push(`ListingKey ne '${q(k)}'`);
    return pullForStats(f.join(' and '), 'SoldEntryTimestamp desc,ListingKey desc', 1000);
  };
  let r = loc.community ? await tryLevel(true) : null;
  let level = 'community';
  if (!r || !r.ok || r.rows.length < 60) {
    r = await tryLevel(false);
    level = 'city';
  }
  if (!r.ok) return null;
  const by = {};
  for (const p of r.rows) {
    if (!(p.ClosePrice > 0) || p.DoNotDiscloseUntilClosingYN) continue;
    const k = ym(p.SoldEntryTimestamp);
    (by[k] ||= []).push(p.ClosePrice);
  }
  const months = [];
  const now = new Date();
  for (let k = 23; k >= 0; k--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1));
    const key = d.toISOString().slice(0, 7);
    const arr = by[key] || [];
    months.push({ month: key, median: arr.length >= 3 ? median(arr) : null, count: arr.length });
  }
  // 3-month rolling median as a smoother index for adjustments.
  const smooth = months.map((m, idx) => {
    const win = months.slice(Math.max(0, idx - 2), idx + 1).flatMap((x) => by[x.month] || []);
    return { month: m.month, index: win.length >= 5 ? median(win) : null };
  });
  const recent = months.slice(-3).flatMap((m) => by[m.month] || []);
  const yearAgo = months.slice(-15, -12).flatMap((m) => by[m.month] || []);
  const yoy = recent.length >= 5 && yearAgo.length >= 5 ? Math.round(((median(recent) / median(yearAgo)) - 1) * 1000) / 10 : null;
  return { level, months, smooth, yoy, sample: r.rows.length };
}

function indexAt(trend, month) {
  if (!trend) return null;
  const s = trend.smooth;
  const latest = [...s].reverse().find((x) => x.index);
  const at = s.find((x) => x.month === month)?.index || null;
  if (!latest || !at) return null;
  const f = latest.index / at;
  return Math.min(1.15, Math.max(0.85, f));
}

// Active supply vs. recent sales: months of inventory tells buyer's vs. seller's market.
async function marketConditions(i, loc, suppressed) {
  const base = areaParts(i, loc, Boolean(loc.community));
  const activeF = ["ContractStatus eq 'Available'", "TransactionType eq 'For Sale'", 'InternetEntireListingDisplayYN eq true', ...base].join(' and ');
  const a = await feedGet(`Property?$count=true&$top=0&$filter=${encodeURIComponent(activeF)}`, { kind: KIND, revalidate: 3600 });
  const soldF = ["MlsStatus eq 'Sold'", "TransactionType eq 'For Sale'", 'InternetEntireListingDisplayYN eq true', 'ClosePrice gt 0', `SoldEntryTimestamp ge ${monthsAgo(3)}`, ...base];
  for (const k of suppressed.slice(0, 50)) soldF.push(`ListingKey ne '${q(k)}'`);
  const s = await pullForStats(soldF.join(' and '), 'SoldEntryTimestamp desc,ListingKey desc', 400);
  if (!a.ok || !s.ok) return null;
  const active = a.data['@odata.count'] ?? 0;
  const perMonth = s.total / 3;
  const cards = s.rows.map(toSoldCard).filter((c) => c.soldPrice);
  const ratios = cards.map((c) => c.ratio).filter((x) => x && x > 50 && x < 200);
  const doms = cards.map((c) => c.dom).filter((x) => Number.isFinite(x));
  const moi = perMonth > 0 ? Math.round((active / perMonth) * 10) / 10 : null;
  return {
    active,
    soldPerMonth: Math.round(perMonth * 10) / 10,
    monthsOfInventory: moi,
    market: moi == null ? null : moi < 3 ? 'seller' : moi <= 6 ? 'balanced' : 'buyer',
    ratio: ratios.length ? Math.round(median(ratios) * 10) / 10 : null,
    overAsking: ratios.length ? Math.round((ratios.filter((x) => x > 100).length / ratios.length) * 100) : null,
    dom: doms.length ? Math.round(median(doms)) : null,
    level: loc.community ? 'community' : 'city',
  };
}

// What similar homes leased for in the last 12 months.
async function rentEstimate(i, loc, suppressed) {
  const f = ["MlsStatus eq 'Leased'", 'InternetEntireListingDisplayYN eq true', 'ClosePrice gt 0', `LeasedEntryTimestamp ge ${monthsAgo(12)}`, ...areaParts(i, loc, Boolean(loc.community)), bedsClause(i)];
  for (const k of suppressed.slice(0, 50)) f.push(`ListingKey ne '${q(k)}'`);
  const r = await pullForStats(f.join(' and '), 'LeasedEntryTimestamp desc,ListingKey desc', 200);
  if (!r.ok) return null;
  const rents = r.rows.map((p) => p.ClosePrice).filter((x) => x > 300 && x < 30000);
  if (rents.length < 4) return null;
  return { median: Math.round(median(rents) / 25) * 25, low: Math.round(pct(rents, 0.25) / 25) * 25, high: Math.round(pct(rents, 0.75) / 25) * 25, count: rents.length };
}

export async function buildReport(i, base) {
  const suppressed = await getSuppressed();
  const loc = base.location;
  const [trend, market, rent, history] = await Promise.all([
    priceTrend(i, loc, suppressed),
    marketConditions(i, loc, suppressed),
    rentEstimate(i, loc, suppressed),
    getAddressHistory({ street: { number: i.number, name: i.street, unit: i.unit || null }, city: loc.city || i.city }),
  ]);

  const methods = [];
  // 1. Comparable sales: median of the most similar recent sales.
  methods.push({ key: 'comps', value: base.value, weight: 0.4, n: base.count });

  // 2. Market-adjusted comparables: each sale moved to today's prices with the area's price trend.
  const adjusted = base.comps.length ? base.compsAll.map((c) => {
    const f = indexAt(trend, ym(c.soldDate)) || 1;
    return { ...c, adjFactor: f, adjPrice: c.soldPrice * f };
  }) : [];
  if (adjusted.length >= 4) methods.push({ key: 'adjusted', value: round5k(median(adjusted.map((c) => c.adjPrice))), weight: 0.3, n: adjusted.length });

  // 3. Price per square foot (only when sizes are known).
  const subj = SIZE_MID[i.size];
  const ppsf = adjusted.map((c) => (mid(c.sqft) ? c.adjPrice / mid(c.sqft) : null)).filter(Boolean);
  if (subj && ppsf.length >= 4) methods.push({ key: 'ppsf', value: round5k(median(ppsf) * subj), weight: 0.2, n: ppsf.length, ppsf: Math.round(median(ppsf)) });

  // 4. This home's own last sale, moved to today's prices.
  const last = (history || []).find((h) => h.status === 'Sold' && h.soldPrice && h.ended);
  let lastSale = null;
  if (last) {
    const f = indexAt(trend, ym(last.ended));
    lastSale = { date: last.ended, price: last.soldPrice, factor: f, today: f ? round5k(last.soldPrice * f) : null, key: last.key };
    if (lastSale.today) methods.push({ key: 'lastSale', value: lastSale.today, weight: 0.25, n: 1 });
  }

  const wsum = methods.reduce((a, m) => a + m.weight, 0);
  const blended = round5k(methods.reduce((a, m) => a + m.value * m.weight, 0) / wsum);
  const spreadSrc = adjusted.length >= 4 ? adjusted.map((c) => c.adjPrice) : base.compsAll.map((c) => c.soldPrice);
  const scale = blended / median(spreadSrc);
  const condition = {
    needsWork: round5k(pct(spreadSrc, 0.15) * scale),
    good: blended,
    renovated: round5k(pct(spreadSrc, 0.85) * scale),
  };
  const low = Math.min(round5k(pct(spreadSrc, 0.25) * scale), round5k(blended * 0.95));
  const high = Math.max(round5k(pct(spreadSrc, 0.75) * scale), round5k(blended * 1.05));
  const shown = adjusted.length ? [...adjusted].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
  const compsShown = base.comps.map((c) => adjusted.find((x) => x.key === c.key) || c);

  return {
    value: blended,
    low,
    high,
    methods,
    condition,
    trend,
    market,
    rent: rent ? { ...rent, yield: Math.round(((rent.median * 12) / blended) * 1000) / 10 } : null,
    lastSale,
    comps: compsShown.length ? compsShown : shown.slice(0, 6),
  };
}


// Turns an MLS® listing into estimate input, so members can value any home they look at.
const SUBTYPE_TO_TYPE = { Detached: 'detached', 'Semi-Detached ': 'semi', 'Semi-Detached': 'semi', 'Att/Row/Townhouse': 'town', 'Condo Townhouse': 'town', 'Condo Apartment': 'condo', Link: 'semi' };

export function listingToParams(l) {
  const type = SUBTYPE_TO_TYPE[l.subtype];
  if (!type || !l.street?.number || !l.street?.name || !l.city) return null;
  const size = Object.entries(SIZES).find(([, list]) => list.includes(l.sqft))?.[0] || '';
  const beds = l.bedsAbove ?? l.beds;
  if (beds == null) return null;
  return {
    addr: `${l.street.number} ${l.street.name}`,
    unit: l.street.unit || '',
    city: l.city,
    type,
    beds: String(beds),
    baths: l.baths ? String(l.baths) : '',
    size,
    key: l.key,
    purpose: 'interested',
  };
}

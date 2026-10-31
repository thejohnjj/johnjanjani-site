// Instant home value from comparable sales in the VOW feed. Plain statistics only (no AI):
// the estimate is the median price of the most similar recent sales, the range is their middle 50%.
// Members-only (VOW): never call this for a visitor without VOW access.
import 'server-only';
import { feedGet, TYPES, AREAS } from '@/lib/proptx';
import { getSuppressed, toSoldCard, median, pct, KIND } from '@/lib/vow-data';

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
  return {
    addr,
    number: m ? m[1] : '',
    street: titled,
    unit: get('unit').replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 10),
    area: AREAS.includes(get('area')) ? get('area') : '',
    type: TYPES[get('type')] ? get('type') : '',
    beds: n('beds', 0, 8),
    baths: n('baths', 1, 8),
    size: SIZES[get('size')] ? get('size') : '',
  };
}

export function inputComplete(i) {
  return Boolean(i.number && i.street && i.area && i.type && i.beds != null);
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
  const f = [`StreetName eq '${q(i.street)}'`, cityClause(i.area)].join(' and ');
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

async function pull(parts, suppressed, top = 100) {
  const f = ["MlsStatus eq 'Sold'", "TransactionType eq 'For Sale'", 'InternetEntireListingDisplayYN eq true', 'ClosePrice gt 0', ...parts];
  for (const k of suppressed.slice(0, 50)) f.push(`ListingKey ne '${q(k)}'`);
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
  const city = cityClause(i.area, loc.city);
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
  ladder.push({ level: 'city', months: 12, parts: [type, cityClause(i.area), `SoldEntryTimestamp ge ${monthsAgo(12)}`] });

  let used = null;
  let res = null;
  for (const step of ladder) {
    const r = await pull(step.parts, suppressed);
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
  };
}

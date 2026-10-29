// Server-only client for the PropTx (AMPRE) RESO Web API.
// Rules from the PropTx IDX/VOW agreements that this file enforces:
//  - listing content is passed through exactly as delivered (no rewriting, no translation),
//  - never more than 100 listings per inquiry,
//  - data is re-fetched at least every 24 hours (we cache for 15 minutes),
//  - listing data is never sent to any AI system.
import 'server-only';

const BASE = 'https://query.ampre.ca/odata/';
export const MAX_RESULTS = 100;
export const PAGE_SIZE = 24;
const CACHE_SECONDS = 900;

export function feedToken(kind = 'idx') {
  return kind === 'vow' ? process.env.PROPTX_VOW_TOKEN : process.env.PROPTX_IDX_TOKEN;
}

export async function feedGet(path, { kind = 'idx', revalidate = CACHE_SECONDS } = {}) {
  const token = feedToken(kind);
  if (!token) return { ok: false, status: 0, error: 'missing token' };
  try {
    const res = await fetch(BASE + path, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    try {
      return { ok: true, status: res.status, data: JSON.parse(text) };
    } catch {
      return { ok: false, status: res.status, error: `bad json (${text.length} bytes)` };
    }
  } catch (e) {
    return { ok: false, status: -1, error: String(e?.message || e).slice(0, 200) };
  }
}

// ---------- search ----------

// GTA municipalities offered in the area filter. Toronto's feed values are districts ("Toronto C01" …).
export const AREAS = [
  'Toronto', 'Richmond Hill', 'Vaughan', 'Markham', 'Aurora', 'Newmarket', 'King', 'Whitchurch-Stouffville',
  'East Gwillimbury', 'Georgina', 'Mississauga', 'Brampton', 'Caledon', 'Oakville', 'Burlington', 'Milton',
  'Halton Hills', 'Pickering', 'Ajax', 'Whitby', 'Oshawa', 'Clarington', 'Uxbridge', 'Scugog', 'Brock',
];

export const TYPES = {
  detached: ["PropertySubType eq 'Detached'"],
  semi: ["PropertySubType eq 'Semi-Detached '", "PropertySubType eq 'Semi-Detached'"],
  town: ["PropertySubType eq 'Att/Row/Townhouse'", "PropertySubType eq 'Condo Townhouse'"],
  condo: ["PropertySubType eq 'Condo Apartment'"],
};

const SORTS = {
  new: 'OriginalEntryTimestamp desc,ListingKey desc',
  low: 'ListPrice asc,ListingKey asc',
  high: 'ListPrice desc,ListingKey desc',
};

const q = (s) => String(s).replace(/'/g, "''");
const int = (v, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

// Turns the page's query string into a clean, safe set of filters.
export function readFilters(sp = {}) {
  const get = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || '';
  const area = AREAS.includes(get('area')) ? get('area') : '';
  const kw = get('q').replace(/[^\p{L}\p{N}\s'.-]/gu, '').trim().slice(0, 40);
  return {
    deal: get('deal') === 'lease' ? 'lease' : 'sale',
    area,
    q: kw,
    type: TYPES[get('type')] ? get('type') : '',
    min: int(get('min'), 0, 100000000),
    max: int(get('max'), 0, 100000000),
    beds: int(get('beds'), 1, 9),
    baths: int(get('baths'), 1, 9),
    sort: SORTS[get('sort')] ? get('sort') : 'new',
    page: int(get('page'), 1, Math.ceil(MAX_RESULTS / PAGE_SIZE)) || 1,
  };
}

function titleCase(s) {
  return s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

export function buildFilter(f) {
  const parts = ["ContractStatus eq 'Available'", 'InternetEntireListingDisplayYN eq true'];
  parts.push(f.deal === 'lease' ? "TransactionType eq 'For Lease'" : "TransactionType eq 'For Sale'");
  if (f.area === 'Toronto') parts.push("startswith(City,'Toronto')");
  else if (f.area) parts.push(`City eq '${q(f.area)}'`);
  if (f.type) parts.push(`(${TYPES[f.type].join(' or ')})`);
  if (f.min) parts.push(`ListPrice ge ${f.min}`);
  if (f.max) parts.push(`ListPrice le ${f.max}`);
  if (f.beds) parts.push(`BedroomsTotal ge ${f.beds}`);
  if (f.baths) parts.push(`BathroomsTotalInteger ge ${f.baths}`);
  if (f.q) {
    const variants = [...new Set([f.q, titleCase(f.q), f.q.toUpperCase()])].map(q);
    const ors = variants.flatMap((v) => [`contains(UnparsedAddress,'${v}')`, `contains(CityRegion,'${v}')`, `ListingKey eq '${v}'`]);
    parts.push(`(${ors.join(' or ')})`);
  }
  return parts.join(' and ');
}

const CARD_FIELDS = [
  'ListingKey', 'ListPrice', 'TransactionType', 'UnparsedAddress', 'InternetAddressDisplayYN', 'City', 'CityRegion',
  'PropertySubType', 'BedroomsAboveGrade', 'BedroomsBelowGrade', 'BedroomsTotal', 'BathroomsTotalInteger',
  'ParkingTotal', 'LivingAreaRange', 'ListOfficeName', 'Latitude', 'Longitude',
];

// The feed rejects $select inside $expand, so only $filter/$orderby are used there.
const cardPhoto = encodeURIComponent("Media($filter=ImageSizeDescription eq 'Medium' and MediaStatus eq 'Active' and PreferredPhotoYN eq true)");
const allPhotos = encodeURIComponent("Media($filter=ImageSizeDescription eq 'Large' and MediaStatus eq 'Active';$orderby=Order)");

export function searchPath(f) {
  const skip = (f.page - 1) * PAGE_SIZE;
  const top = Math.min(PAGE_SIZE, MAX_RESULTS - skip);
  return 'Property?$count=true' +
    `&$filter=${encodeURIComponent(buildFilter(f))}` +
    `&$select=${CARD_FIELDS.join(',')}` +
    `&$orderby=${encodeURIComponent(SORTS[f.sort])}` +
    `&$top=${top}&$skip=${skip}` +
    `&$expand=${cardPhoto}`;
}

export async function searchListings(f, { kind = 'idx' } = {}) {
  if ((f.page - 1) * PAGE_SIZE >= MAX_RESULTS) return { ok: true, total: 0, items: [] };
  const r = await feedGet(searchPath(f), { kind });
  if (!r.ok) return { ok: false, status: r.status, error: r.error, total: 0, items: [] };
  return { ok: true, total: r.data['@odata.count'] ?? 0, items: (r.data.value || []).map(toCard) };
}

function toCard(p) {
  const showAddress = p.InternetAddressDisplayYN !== false;
  return {
    key: p.ListingKey,
    price: p.ListPrice,
    lease: p.TransactionType !== 'For Sale',
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
    lat: showAddress ? p.Latitude : null,
    lng: showAddress ? p.Longitude : null,
    photo: (p.Media || [])[0]?.MediaURL || null,
  };
}

// ---------- one listing ----------

const DETAIL_FIELDS = [
  ...CARD_FIELDS, 'PublicRemarks', 'TaxAnnualAmount', 'TaxYear', 'AssociationFee', 'AssociationFeeIncludes',
  'ApproximateAge', 'Basement', 'HeatType', 'Cooling', 'GarageType', 'LotWidth', 'LotDepth', 'LotSizeUnits',
  'Exposure', 'Locker', 'PetsAllowed', 'CrossStreet', 'DaysOnMarket', 'KitchensTotal', 'ArchitecturalStyle',
  'ConstructionMaterials', 'Furnished', 'VirtualTourURLUnbranded', 'ContractStatus', 'InternetEntireListingDisplayYN',
];

export async function getFeedListing(key, { kind = 'idx' } = {}) {
  if (!/^[A-Za-z0-9-]{4,20}$/.test(key || '')) return null;
  const path =
    `Property?$filter=${encodeURIComponent(`ListingKey eq '${q(key)}'`)}` +
    `&$select=${DETAIL_FIELDS.join(',')}&$top=1` +
    `&$expand=${allPhotos}`;
  const r = await feedGet(path, { kind });
  if (!r.ok) return { error: r.status };
  const p = (r.data.value || [])[0];
  if (!p || p.InternetEntireListingDisplayYN === false || p.ContractStatus !== 'Available') return null;
  const card = toCard(p);
  return {
    ...card,
    remarks: p.PublicRemarks || '',
    photos: uniquePhotos(p.Media),
    tour: /^https:\/\//.test(p.VirtualTourURLUnbranded || '') ? p.VirtualTourURLUnbranded : null,
    facts: [
      ['taxes', p.TaxAnnualAmount ? `$${Number(p.TaxAnnualAmount).toLocaleString('en-US')}${p.TaxYear ? ` (${p.TaxYear})` : ''}` : null],
      ['fee', p.AssociationFee ? `$${Number(p.AssociationFee).toLocaleString('en-US')}` : null],
      ['feeIncludes', list(p.AssociationFeeIncludes)],
      ['style', list(p.ArchitecturalStyle)],
      ['age', p.ApproximateAge],
      ['basement', list(p.Basement)],
      ['heat', p.HeatType],
      ['cooling', list(p.Cooling)],
      ['garage', p.GarageType],
      ['lot', p.LotWidth && p.LotDepth ? `${p.LotWidth} x ${p.LotDepth}${p.LotSizeUnits ? ` ${p.LotSizeUnits}` : ''}` : null],
      ['exposure', p.Exposure],
      ['locker', p.Locker],
      ['pets', list(p.PetsAllowed)],
      ['furnished', p.Furnished],
      ['exterior', list(p.ConstructionMaterials)],
      ['kitchens', p.KitchensTotal],
      ['cross', p.CrossStreet],
      ['dom', p.DaysOnMarket],
    ].filter(([, v]) => v !== null && v !== undefined && v !== ''),
  };
}

function uniquePhotos(media) {
  const seen = new Set();
  const out = [];
  for (const m of media || []) {
    if (!m.MediaURL || seen.has(m.Order)) continue;
    seen.add(m.Order);
    out.push(m.MediaURL);
  }
  return out;
}

function list(v) {
  return Array.isArray(v) && v.length ? v.join(', ') : null;
}

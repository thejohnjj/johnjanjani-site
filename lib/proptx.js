// Server-only client for the PropTx (AMPRE) RESO Web API.
// Listing data from this feed is shown exactly as delivered and is never sent to any AI system.
const BASE = 'https://query.ampre.ca/odata/';

export function feedToken(kind = 'idx') {
  return kind === 'vow' ? process.env.PROPTX_VOW_TOKEN : process.env.PROPTX_IDX_TOKEN;
}

export async function feedGet(path, { kind = 'idx', revalidate = 3600 } = {}) {
  const token = feedToken(kind);
  if (!token) return { ok: false, status: 0, error: 'missing token' };
  const res = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    next: { revalidate },
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: res.status, data: await res.json() };
}

// Records an instant-estimate request as a seller lead (once a day per member and address).
// The estimated number itself is not sent anywhere: it is VOW-derived data and stays on the website.
import 'server-only';
import { db } from '@/lib/supabase';
import { notify } from '@/lib/notify';
import { pushLeadSoon } from '@/lib/zoho';

export async function recordEstimateLead(member, i, lang) {
  const client = db();
  if (!client || !member) return;
  const full = await client.from('members').select('name, email, phone, lang').eq('id', member.id).maybeSingle();
  const m = full.data;
  if (!m) return;
  const address = `${i.unit ? `${i.unit} - ` : ''}${i.addr}, ${i.city || i.area}`;
  const buyer = i.purpose === 'interested';
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await client.from('leads').select('id', { count: 'exact', head: true }).eq('email', m.email).eq('details->>address', address).gte('created_at', since);
  if (count) return;
  const details = { address, city: i.city || i.area, type: i.type, beds: String(i.beds ?? ''), baths: String(i.baths ?? ''), size: i.size || '', source: 'instant estimate', purpose: buyer ? 'interested in buying' : 'own home', listing: i.exclude || '' };
  await client.from('leads').insert({ kind: 'valuation', name: m.name, email: m.email, phone: m.phone, lang, details, consent: true });
  await notify(`${buyer ? 'Buyer' : 'Seller'} estimate: ${address}`, [
    buyer ? `${m.name} checked the value of a home they're interested in${i.exclude ? ` (MLS ${i.exclude})` : ''}.` : `${m.name} checked the instant home value for their own home.`,
    `Address: ${address}`,
    `Type: ${i.type} · Beds: ${i.beds ?? '—'} · Baths: ${i.baths ?? '—'} · Size: ${i.size || 'not given'}`,
    `Phone: ${m.phone}`,
    `Email: ${m.email}`,
    `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
    '',
    buyer ? 'Likely a buyer: offer a showing or a price opinion on this home. See all requests at johnjanjani.com/admin' : 'Likely a seller: follow up with your own evaluation. See all requests at johnjanjani.com/admin',
  ]);
  await pushLeadSoon({
    name: m.name, email: m.email, phone: m.phone, lang, interest: buyer ? 'buy' : 'sell', tags: [buyer ? 'Buyer estimate' : 'Instant estimate'],
    noteTitle: `${buyer ? 'Buyer' : 'Seller'} estimate viewed: ${address}`,
    note: `${buyer ? `Checked the value of a home they're interested in${i.exclude ? ` (MLS ${i.exclude})` : ''}` : 'Checked the instant home value of their own home'} on johnjanjani.com.\nAddress: ${address}\nType: ${i.type} · Beds: ${i.beds ?? '—'} · Baths: ${i.baths ?? '—'} · Size: ${i.size || 'not given'}`,
  });
}

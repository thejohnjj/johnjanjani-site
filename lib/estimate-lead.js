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
  const address = `${i.unit ? `${i.unit} - ` : ''}${i.addr}, ${i.area}`;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await client.from('leads').select('id', { count: 'exact', head: true }).eq('email', m.email).eq('details->>address', address).gte('created_at', since);
  if (count) return;
  const details = { address, city: i.area, type: i.type, beds: String(i.beds ?? ''), baths: String(i.baths ?? ''), size: i.size || '', source: 'instant estimate' };
  await client.from('leads').insert({ kind: 'valuation', name: m.name, email: m.email, phone: m.phone, lang, details, consent: true });
  await notify(`Instant estimate viewed: ${address}`, [
    `${m.name} checked the instant home value for their home.`,
    `Address: ${address}`,
    `Type: ${i.type} · Beds: ${i.beds ?? '—'} · Baths: ${i.baths ?? '—'} · Size: ${i.size || 'not given'}`,
    `Phone: ${m.phone}`,
    `Email: ${m.email}`,
    `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
    '',
    'Likely a seller: follow up with your own evaluation. See all requests at johnjanjani.com/admin',
  ]);
  await pushLeadSoon({
    name: m.name, email: m.email, phone: m.phone, lang, interest: 'sell', tags: ['Instant estimate'],
    noteTitle: `Instant estimate viewed: ${address}`,
    note: `Checked the instant home value on johnjanjani.com.\nAddress: ${address}\nType: ${i.type} · Beds: ${i.beds ?? '—'} · Baths: ${i.baths ?? '—'} · Size: ${i.size || 'not given'}`,
  });
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { setGuideCookie } from '@/lib/session';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v, n = 200) => String(v ?? '').trim().slice(0, n);

const TYPES = ['detached', 'semi', 'townhouse', 'condo', 'other'];
const TIMELINES = ['0-3', '3-6', '6-12', 'curious'];

// Saves a home value request or a guide download as a lead and emails John.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const kind = b.kind === 'guide' ? 'guide' : b.kind === 'valuation' ? 'valuation' : null;
  if (!kind) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const name = clip(b.name, 120);
  const email = clip(b.email).toLowerCase();
  const phone = clip(b.phone, 40);
  const lang = b.lang === 'fa' ? 'fa' : 'en';
  if (name.length < 2) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  if (kind === 'valuation' && phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'phone' }, { status: 400 });
  if (phone && phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'phone' }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: 'consent' }, { status: 400 });

  let details = {};
  if (kind === 'valuation') {
    details = {
      address: clip(b.address),
      city: clip(b.city, 80),
      type: TYPES.includes(b.type) ? b.type : 'other',
      beds: clip(b.beds, 10),
      baths: clip(b.baths, 10),
      timeline: TIMELINES.includes(b.timeline) ? b.timeline : 'curious',
      note: clip(b.note, 1000),
    };
    if (details.address.length < 5) return NextResponse.json({ error: 'address' }, { status: 400 });
  } else {
    details = { stage: clip(b.stage, 40) };
  }

  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });
  const { error } = await client.from('leads').insert({ kind, name, email, phone: phone || null, lang, details, consent: true });
  if (error) {
    console.error('lead insert', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }

  const timelineLabel = { '0-3': 'within 3 months', '3-6': 'in 3–6 months', '6-12': 'in 6–12 months', curious: 'just curious' };
  if (kind === 'valuation') {
    await notify(`Home value request: ${details.address}`, [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
      '',
      `Address: ${details.address}${details.city ? `, ${details.city}` : ''}`,
      `Type: ${details.type} · Beds: ${details.beds || '—'} · Baths: ${details.baths || '—'}`,
      `Thinking of selling: ${timelineLabel[details.timeline]}`,
      details.note ? `Note: ${details.note}` : '',
      '',
      'Promised: an estimate within 24 hours. See all requests at johnjanjani.com/admin',
    ]);
  } else {
    await notify(`Guide download: ${name}`, [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
      details.stage ? `Stage: ${details.stage}` : '',
      '',
      'See all leads at johnjanjani.com/admin',
    ]);
  }

  const res = NextResponse.json({ ok: true });
  if (kind === 'guide') setGuideCookie(res);
  return res;
}

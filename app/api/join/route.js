import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { setMemberCookie } from '@/lib/session';
import { notify } from '@/lib/notify';
import { welcomeEmail, sendMemberEmail } from '@/lib/member-mail';
import { pushLeadSoon } from '@/lib/zoho';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 40);
  const lang = body.lang === 'fa' ? 'fa' : 'en';
  const consent = body.consent === true;
  const firstListing = body.firstListing ? String(body.firstListing).slice(0, 160) : null;

  if (name.length < 2) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  if (phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'phone' }, { status: 400 });
  if (!consent) return NextResponse.json({ error: 'consent' }, { status: 400 });

  const client = db();
  if (!client) return NextResponse.json({ error: 'server' }, { status: 500 });

  const now = new Date().toISOString();
  const { data: existing } = await client.from('members').select('id').eq('email', email).maybeSingle();
  let id = existing?.id;
  if (id) {
    await client.from('members').update({ name, phone, lang, consent: true, consent_at: now, last_seen_at: now }).eq('id', id);
  } else {
    const { data, error } = await client
      .from('members')
      .insert({ name, email, phone, lang, consent: true, consent_at: now, first_listing: firstListing })
      .select('id')
      .single();
    if (error) {
      console.error('join insert', error.message);
      return NextResponse.json({ error: 'server' }, { status: 500 });
    }
    id = data.id;
    await notify(`New member: ${name}`, [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
      firstListing ? `Looking at: ${firstListing}` : '',
      '',
      'See all members at johnjanjani.com/admin',
    ]);
    // Welcome email in the language they joined in.
    const mail = welcomeEmail({ id, name, lang });
    const sent = await sendMemberEmail({ to: email, ...mail, memberId: id });
    if (sent) await client.from('members').update({ welcome_sent_at: new Date().toISOString() }).eq('id', id);
    await pushLeadSoon({
      name, email, phone, lang,
      description: `Joined johnjanjani.com as a member (${lang === 'fa' ? 'Farsi' : 'English'}).${firstListing ? ` First home viewed: ${firstListing}.` : ''}`,
    });
  }

  const res = NextResponse.json({ ok: true, name });
  setMemberCookie(res, id);
  return res;
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { checkLink } from '@/lib/member-mail';
import { pushLeadSoon } from '@/lib/zoho';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function optOut(req) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get('m') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id) || !checkLink(id, 'unsub', '', sp.get('s'))) return null;
  const client = db();
  if (!client) return 'en';
  const { data } = await client.from('members').update({ email_opt_out: true, email_opt_out_at: new Date().toISOString() }).eq('id', id).select('lang, name, email, phone').maybeSingle();
  if (data) await pushLeadSoon({ name: data.name, email: data.email, phone: data.phone, lang: data.lang, optOut: true, noteTitle: 'Unsubscribed', note: 'Unsubscribed from website emails.' });
  return data?.lang === 'fa' ? 'fa' : 'en';
}

// Link in every member email. GET shows a confirmation page; POST supports one-click unsubscribe in mail apps.
export async function GET(req) {
  const lang = await optOut(req);
  return NextResponse.redirect(`${SITE}/${lang || 'en'}/thanks?u=${lang ? 1 : 0}`, 302);
}

export async function POST(req) {
  await optOut(req);
  return new NextResponse(null, { status: 204 });
}

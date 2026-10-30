import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { notify } from '@/lib/notify';
import { checkLink, INTERESTS } from '@/lib/member-mail';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LABEL = { buy: 'Buying', sell: 'Selling', rent: 'Renting', browse: 'Just looking' };

// One-tap answer from the welcome email: saves what the member is looking for and alerts John.
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get('m') || '';
  const v = sp.get('v') || '';
  if (!INTERESTS.includes(v) || !/^[0-9a-f-]{36}$/i.test(id) || !checkLink(id, 'interest', v, sp.get('s'))) {
    return NextResponse.redirect(`${SITE}/en`, 302);
  }
  const client = db();
  let lang = 'en';
  if (client) {
    const { data } = await client.from('members').select('name, email, phone, lang, interest').eq('id', id).maybeSingle();
    if (data) {
      lang = data.lang === 'fa' ? 'fa' : 'en';
      await client.from('members').update({ interest: v, interest_at: new Date().toISOString() }).eq('id', id);
      if (data.interest !== v) {
        await notify(`${data.name} is ${LABEL[v].toLowerCase()}`, [
          `${data.name} answered the welcome email: ${LABEL[v]}`,
          `Phone: ${data.phone}`,
          `Email: ${data.email}`,
          `Language: ${lang === 'fa' ? 'Farsi' : 'English'}`,
          '',
          'See all members at johnjanjani.com/admin',
        ]);
      }
    }
  }
  return NextResponse.redirect(`${SITE}/${lang}/thanks?i=${v}`, 302);
}

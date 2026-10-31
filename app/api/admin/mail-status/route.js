import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { memberFrom } from '@/lib/member-mail';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Whether member emails can go out: shows only the sender's domain, never keys.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const from = memberFrom();
  const domain = (from.match(/@([^>\s]+)/) || [])[1] || null;
  let domains = null;
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).catch(() => null);
    if (r?.ok) domains = ((await r.json()).data || []).map((d) => ({ name: d.name, status: d.status }));
    else domains = { status: r?.status ?? 'failed' };
  }
  const client = db();
  const cols = client ? await client.from('members').select('interest, email_opt_out, welcome_sent_at').limit(1) : null;
  const columnsReady = cols ? !cols.error : null;
  const rt = process.env.MEMBER_REPLY_TO || '';
  const replyToDomain = (rt.match(/@([^>\s]+)/) || [])[1] || null;
  return NextResponse.json({ replyToDomain, columnsReady, resendKey: Boolean(process.env.RESEND_API_KEY), senderDomain: domain, resendDomains: domains });
}

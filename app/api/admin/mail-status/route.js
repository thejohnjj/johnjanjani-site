import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { memberFrom } from '@/lib/member-mail';

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
  return NextResponse.json({ resendKey: Boolean(process.env.RESEND_API_KEY), senderDomain: domain, resendDomains: domains });
}

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/lib/supabase';
import { pushLead } from '@/lib/zoho';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// One-time: copies existing members into Zoho Leads (already-existing leads are matched by email, not duplicated).
export async function POST() {
  if (!isAdmin()) return NextResponse.redirect(`${SITE}/admin`, 303);
  const client = db();
  const { data: members } = await client.from('members').select('*').order('created_at', { ascending: true }).limit(500);
  let ok = 0;
  let failed = 0;
  for (const m of members || []) {
    const r = await pushLead({
      name: m.name,
      email: m.email,
      phone: m.phone,
      lang: m.lang,
      interest: m.interest,
      optOut: m.email_opt_out === true,
      description: `Joined johnjanjani.com on ${new Date(m.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })} (${m.lang === 'fa' ? 'Farsi' : 'English'}).${m.first_listing ? ` First home viewed: ${m.first_listing}.` : ''}`,
    });
    if (r.ok) ok++;
    else failed++;
  }
  return NextResponse.redirect(`${SITE}/admin?zoho=synced&ok=${ok}&failed=${failed}`, 303);
}

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { authUrl, zohoConfigured } from '@/lib/zoho';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

// "Connect Zoho" button on /admin: sends John to Zoho's consent screen.
export async function GET() {
  if (!isAdmin()) return NextResponse.redirect(`${SITE}/admin`, 302);
  if (!zohoConfigured()) return NextResponse.redirect(`${SITE}/admin?zoho=missing-keys`, 302);
  return NextResponse.redirect(authUrl(), 302);
}

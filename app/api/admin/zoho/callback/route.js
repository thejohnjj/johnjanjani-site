import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { checkState, finishConnect } from '@/lib/zoho';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Zoho sends John back here after he approves; we keep the long-lived token (encrypted).
export async function GET(req) {
  if (!isAdmin()) return NextResponse.redirect(`${SITE}/admin`, 302);
  const sp = new URL(req.url).searchParams;
  if (sp.get('error')) return NextResponse.redirect(`${SITE}/admin?zoho=denied`, 302);
  if (!checkState(sp.get('state')) || !sp.get('code')) return NextResponse.redirect(`${SITE}/admin?zoho=expired`, 302);
  try {
    await finishConnect(sp.get('code'), sp.get('accounts-server'));
    return NextResponse.redirect(`${SITE}/admin?zoho=connected`, 302);
  } catch (e) {
    console.error('zoho connect', e?.message);
    return NextResponse.redirect(`${SITE}/admin?zoho=failed&why=${encodeURIComponent(String(e?.message || '').slice(0, 60))}`, 302);
  }
}

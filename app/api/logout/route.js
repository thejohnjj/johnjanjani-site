import { NextResponse } from 'next/server';
import { clearMemberCookie } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearMemberCookie(res);
  return res;
}

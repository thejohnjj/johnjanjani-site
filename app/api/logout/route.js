import { NextResponse } from 'next/server';
import { clearMemberCookie } from '@/lib/session';
import { clearVowCookie } from '@/lib/vow';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearMemberCookie(res);
  clearVowCookie(res);
  return res;
}

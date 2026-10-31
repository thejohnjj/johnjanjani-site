import { NextResponse } from 'next/server';
import { findMemberByEmail, tooManyAttempts } from '@/lib/vow';
import { sendReset } from '../_shared';

export const runtime = 'nodejs';

// Always answers "sent" so the form can't be used to find out who has an account.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  if (await tooManyAttempts('vow_forgot', 5, 30)) return NextResponse.json({ error: 'slow_down' }, { status: 429 });
  const m = await findMemberByEmail(b.email);
  if (m) await sendReset(m, b.lang === 'fa' ? 'fa' : m.lang);
  return NextResponse.json({ ok: true });
}

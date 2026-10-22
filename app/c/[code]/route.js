import { NextResponse } from 'next/server';
import { slugForCode } from '@/lib/listings';

export const dynamic = 'force-dynamic';

// Short link for Instagram captions: /c/12 → the listing with code 12, in the visitor's language.
export async function GET(req, { params }) {
  const accept = req.headers.get('accept-language') || '';
  const lang = /^fa|,\s*fa/i.test(accept) ? 'fa' : 'en';
  const slug = await slugForCode(decodeURIComponent(params.code));
  const url = new URL(slug ? `/${lang}/listings/${slug}` : `/${lang}/listings`, req.url);
  return NextResponse.redirect(url, 307);
}

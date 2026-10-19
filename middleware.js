import { NextResponse } from 'next/server';

// Sends visitors from "/" to /en or /fa based on their browser language.
export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname === '/') {
    const accept = req.headers.get('accept-language') || '';
    const lang = /^fa|,\s*fa/i.test(accept) ? 'fa' : 'en';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/'] };

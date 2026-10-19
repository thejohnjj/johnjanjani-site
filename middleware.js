import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Sends visitors from "/" to /en or /fa based on their browser language.
  if (pathname === '/') {
    const accept = req.headers.get('accept-language') || '';
    const lang = /^fa|,\s*fa/i.test(accept) ? 'fa' : 'en';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}`;
    return NextResponse.redirect(url);
  }

  // "/en/admin", "/fa/admin", "/Admin" and similar all lead to the admin page.
  const admin = pathname.match(/^\/(?:(?:en|fa)\/)?admin(\/.*)?$/i);
  if (admin && pathname !== `/admin${admin[1] || ''}`) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${admin[1] || ''}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|images|fonts|icon.svg|robots.txt|sitemap.xml).*)'],
};

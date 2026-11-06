import { NextRequest, NextResponse } from 'next/server';

const APP_CSP_PREFIXES = ['/dashboard', '/test', '/profile', '/admin'];

function isAppRoute(pathname: string): boolean {
  const path = pathname === '/en' ? '/' : pathname.startsWith('/en/') ? pathname.slice(3) : pathname;
  return APP_CSP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function cspForNonce(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api.dictionaryapi.dev https://accounts.google.com https://www.gstatic.com https://mc.yandex.ru wss://det-academy.ru",
    "img-src 'self' data: https: https://mc.yandex.ru",
    "frame-src https://accounts.google.com",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isEnglish = pathname === '/en' || pathname.startsWith('/en/');
  const appRoute = isAppRoute(pathname);
  const requestHeaders = new Headers(request.headers);
  let nonce = '';
  if (appRoute) {
    nonce = crypto.randomUUID().replace(/-/g, '');
    const policy = cspForNonce(nonce);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', policy);
  }

  let response: NextResponse;
  if (isEnglish) {
    const stripped = pathname === '/en' ? '/' : pathname.slice(3);
    const url = request.nextUrl.clone();
    url.pathname = stripped || '/';
    url.searchParams.set('lang', 'en');
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.cookies.set('det_locale', 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (nonce) response.headers.set('Content-Security-Policy', cspForNonce(nonce));
  return response;
}

export const config = {
  matcher: ['/en', '/en/:path*', '/dashboard/:path*', '/test/:path*', '/profile/:path*', '/admin/:path*'],
};

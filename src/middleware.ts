import { NextRequest, NextResponse } from 'next/server';

/**
 * Explicit English URLs (`/en/...`) rewrite to the existing client-rendered
 * route with `?lang=en`. This gives crawlers and users a stable URL while the
 * application keeps one route tree.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== '/en' && !pathname.startsWith('/en/')) {
    return NextResponse.next();
  }

  const stripped = pathname === '/en' ? '/' : pathname.slice(3);
  const url = request.nextUrl.clone();
  url.pathname = stripped || '/';
  url.searchParams.set('lang', 'en');

  const response = NextResponse.rewrite(url);
  response.cookies.set('det_locale', 'en', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: ['/en', '/en/:path*'],
};

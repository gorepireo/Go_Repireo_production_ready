import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/maintenance', '/verify/certificate', '/api/public/certificates'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Go_Repireo is currently under maintenance.' },
      { status: 503, headers: { 'Retry-After': '3600' } },
    );
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = '/maintenance';
  maintenanceUrl.search = '';
  return NextResponse.redirect(maintenanceUrl, 307);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|manifest.json|robots.txt|sitemap.xml).*)'],
};

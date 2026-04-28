import { NextRequest, NextResponse } from 'next/server';
import { authenticatedRoutes, KEYS, ROUTES, withoutAuthenticatedRoutes } from '@/paths';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get(KEYS.COOKIES.USER_SESSIONS)?.value ?? '';

  const matchesRoute = (route: string, p: string) => {
    if (route === p) return true;
    const normalized = route.endsWith('/') ? route : route + '/';
    return p.startsWith(normalized);
  };

  const isProtected = authenticatedRoutes.some((route) => matchesRoute(route, path));
  const isPublic = withoutAuthenticatedRoutes.some((route) => route === path);

  if (!session && isProtected) {
    const signInUrl = new URL(ROUTES.NO_AUTH.SIGN_IN, request.url);
    return NextResponse.redirect(signInUrl.toString());
  }

  if (session && isPublic) {
    const dashboardUrl = new URL(ROUTES.AUTHENTICATED.HOME, request.url);
    return NextResponse.redirect(dashboardUrl.toString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js).*)'],
};

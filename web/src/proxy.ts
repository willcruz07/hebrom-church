import { NextRequest, NextResponse } from 'next/server'
import { authenticatedRoutes, KEYS, matchesRoute, ROUTES } from '@/paths'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const session = request.cookies.get(KEYS.COOKIES.USER_SESSIONS)?.value ?? ''

  const isProtected = authenticatedRoutes.some((route) => matchesRoute(route, path))

  if (!session && isProtected) {
    const signInUrl = new URL(ROUTES.NO_AUTH.SIGN_IN, request.url)
    return NextResponse.redirect(signInUrl.toString())
  }

  // Só a landing (start_url do PWA) pula direto para o dashboard. O /login nunca é
  // bloqueado pelo cookie: se ele estiver velho ou ainda não tiver sido apagado no
  // logout, redirecionar /login → /dashboard prende o usuário num loop. Quem leva um
  // usuário já logado do /login para o dashboard é o AuthSession, no cliente.
  if (session && path === ROUTES.NO_AUTH.HOME) {
    const dashboardUrl = new URL(ROUTES.AUTHENTICATED.HOME, request.url)
    return NextResponse.redirect(dashboardUrl.toString())
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js).*)'],
}

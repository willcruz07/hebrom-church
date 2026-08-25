'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/store/useAuth'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { authenticatedRoutes, matchesRoute, ROUTES, withoutAuthenticatedRoutes } from '@/paths'

interface IAuthSessionProps {
  children: React.ReactNode
}

export function AuthSession({ children }: IAuthSessionProps) {
  const { checkAuth, currentUser, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Rede de segurança: reage ao currentUser em vez de depender só do router.replace
  // dentro do handler de login, que pode nunca resolver no mesmo contexto no iOS.
  useEffect(() => {
    if (loading.checkAuth) return

    const isProtected = authenticatedRoutes.some((route) => matchesRoute(route, pathname))
    const isPublic = withoutAuthenticatedRoutes.some((route) => route === pathname)

    if (currentUser && isPublic) {
      router.replace(ROUTES.AUTHENTICATED.HOME)
    } else if (!currentUser && isProtected) {
      router.replace(ROUTES.NO_AUTH.SIGN_IN)
    }
  }, [currentUser, loading.checkAuth, pathname, router])

  if (loading.checkAuth) {
    return <LoadingScreen />
  }

  return <>{children}</>
}

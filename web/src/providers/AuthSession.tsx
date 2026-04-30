'use client'

import { useEffect } from 'react'
import { useAuth } from '@/store/useAuth'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface IAuthSessionProps {
  children: React.ReactNode
}

export function AuthSession({ children }: IAuthSessionProps) {
  const { checkAuth, loading } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading.checkAuth) {
    return <LoadingScreen />
  }

  return <>{children}</>
}

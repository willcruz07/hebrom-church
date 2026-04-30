'use client'

import { useEffect } from 'react'
import { useAuth } from '@/store/useAuth'

interface IAuthSessionProps {
  children: React.ReactNode
}

export function AuthSession({ children }: IAuthSessionProps) {
  const { checkAuth, loading } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading.checkAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return <>{children}</>
}

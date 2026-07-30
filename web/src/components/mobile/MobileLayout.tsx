'use client'

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MobileBottomNav } from './MobileBottomNav'
import { useAuth } from '@/store/useAuth'
import { Menu } from 'lucide-react'
import { useMenuState } from '@/store/useMenuState'
import { usePermissions } from '@/hooks/usePermissions'
import { useNewUsersStore } from '@/store/useNewUsersStore'
import Image from 'next/image'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface MobileLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  className?: string
  contentClassName?: string
}

export function MobileLayout({
  children,
  showBottomNav = true,
  className,
  contentClassName,
}: MobileLayoutProps) {
  const { currentUser } = useAuth()
  const { setMenuIsOpen } = useMenuState()
  const { pendingCount, visitorsCount, startMonitoring } = useNewUsersStore()
  const { permissions, isVisitor } = usePermissions()

  useEffect(() => {
    const unsub = startMonitoring(permissions.canManageUsers)
    return () => unsub()
  }, [permissions.canManageUsers, startMonitoring])

  const hasNotifications = pendingCount > 0 || visitorsCount > 0

  return (
    <div className={cn('flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950', className)}>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        {!isVisitor ? (
          <button
            onClick={() => setMenuIsOpen(true)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="h-6 w-6" />
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 flex h-3 w-3">
                <span className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  pendingCount > 0 ? "bg-red-400" : "bg-blue-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex h-3 w-3 rounded-full",
                  pendingCount > 0 ? "bg-red-500" : "bg-blue-500"
                )}></span>
              </span>
            )}
          </button>
        ) : (
          <div className="w-10" /> // Spacer for layout balance
        )}

        <div className="flex items-center gap-2">
          <Image src="/logo_sb.png" alt="Hebrom" width={124} height={124} className=" w-auto" />
        </div>

        <UserAvatar
          src={currentUser?.profile.avatar_url}
          name={currentUser?.profile.full_name}
          size={40}
          textClassName="text-sm"
        />
      </header>

      <main
        className={cn(
          'flex-1 overflow-y-auto px-4 py-6',
          showBottomNav && 'pb-mobile-nav',
          contentClassName,
        )}
      >
        {children}
      </main>

      {showBottomNav && <MobileBottomNav />}
    </div>
  )
}

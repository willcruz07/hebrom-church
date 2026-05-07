'use client'

import { usePathname } from 'next/navigation'
import { useNavigation } from '@/hooks/useNavigation'
import { usePermissions } from '@/hooks/usePermissions'
import { ROUTES } from '@/paths'
import { useNewUsersStore } from '@/store/useNewUsersStore'
import clsx from 'clsx'
import { MessageSquare, Heart, Calendar, Settings, Home, Users } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: (pathname: string) => boolean
  permission?: string
}

const navigationItems: NavItem[] = [
  {
    name: 'Mural',
    href: ROUTES.AUTHENTICATED.MURAL,
    icon: MessageSquare,
    isActive: (pathname) => pathname.startsWith(ROUTES.AUTHENTICATED.MURAL),
    permission: 'canViewGeneralFeed',
  },
  {
    name: 'Oração',
    href: ROUTES.AUTHENTICATED.PRAYER,
    icon: Heart,
    isActive: (pathname) => pathname.startsWith(ROUTES.AUTHENTICATED.PRAYER),
    permission: 'canRequestPrayer',
  },
  {
    name: 'Membros',
    href: ROUTES.AUTHENTICATED.MEMBERS,
    icon: Users,
    isActive: (pathname) => pathname.startsWith(ROUTES.AUTHENTICATED.MEMBERS),
    permission: 'canManageUsers',
  },
  {
    name: 'Home',
    href: ROUTES.AUTHENTICATED.HOME, // Será tratado dinamicamente no componente
    icon: Home,
    isActive: (pathname) => pathname === ROUTES.AUTHENTICATED.HOME,
    permission: 'canViewDashboardOverview',
  },
  {
    name: 'Home',
    href: ROUTES.AUTHENTICATED.MURAL,
    icon: Home,
    isActive: (pathname) =>
      pathname === ROUTES.AUTHENTICATED.MURAL || pathname === ROUTES.AUTHENTICATED.HOME,
  },
  {
    name: 'Agenda',
    href: ROUTES.AUTHENTICATED.AGENDA,
    icon: Calendar,
    isActive: (pathname) => pathname.startsWith(ROUTES.AUTHENTICATED.AGENDA),
    permission: 'canViewAgenda',
  },
  {
    name: 'Configuração',
    href: ROUTES.AUTHENTICATED.PROFILE,
    icon: Settings,
    isActive: (pathname) => pathname.startsWith(ROUTES.AUTHENTICATED.PROFILE),
  },
]

interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { navigateTo } = useNavigation()
  const { permissions, isVisitor } = usePermissions()
  const { pendingCount, visitorsCount } = useNewUsersStore()

  const hasNotifications = pendingCount > 0 || visitorsCount > 0

  const handleNavigation = (href: string) => {
    navigateTo(href)
  }

  const filteredNavigation = navigationItems.filter((item) => {
    // Hide specific items for visitors: Home and Prayer
    if (isVisitor && (item.name === 'Home' || item.name === 'Oração')) {
      return false
    }

    // Ocultar Oração para administradores para manter o limite de 5 itens no bottom nav
    if (item.name === 'Oração' && (permissions as any).canManageUsers) {
      return false
    }

    // Lógica especial para o botão Home duplicado (para não-visitantes)
    if (item.name === 'Home') {
      if (item.href === ROUTES.AUTHENTICATED.HOME) return permissions.canViewDashboardOverview
      if (item.href === ROUTES.AUTHENTICATED.MURAL) return !permissions.canViewDashboardOverview
    }

    if (!item.permission) return true
    return (permissions as any)[item.permission]
  })

  const homeIndex = filteredNavigation.findIndex((item) => item.name === 'Home')
  const leftItems = homeIndex !== -1 ? filteredNavigation.slice(0, homeIndex) : []
  const rightItems = homeIndex !== -1 ? filteredNavigation.slice(homeIndex + 1) : filteredNavigation
  const homeItem = homeIndex !== -1 ? filteredNavigation[homeIndex] : null

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const isHome = item.name === 'Home'
    const isActive = item.isActive
      ? item.isActive(pathname) && !isHome
      : pathname === item.href

    return (
      <button
        key={item.href}
        onClick={() => handleNavigation(item.href)}
        className={clsx(
          'group relative flex flex-col items-center justify-center transition-all duration-200',
          {
            'text-amber-500': isActive,
            'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white': !isActive,
            'bg-slate-950 -mt-8 h-16 w-16 !rounded-full border-4 border-white shadow-xl z-50 dark:border-slate-950': isHome,
            'w-16 space-y-1': !isHome,
          }
        )}
      >
        <div
          className={clsx('relative transition-all duration-200', {
            'rounded-xl p-2': !isHome,
            'bg-amber-500/10 scale-110': isActive && !isHome,
            'group-hover:bg-slate-100 dark:group-hover:bg-slate-800': !isActive && !isHome,
          })}
        >
          <Icon
            className={clsx('transition-all duration-200', {
              'h-5 w-5': !isHome,
              'h-7 w-7 text-amber-500': isHome,
              'text-amber-500': isActive && !isHome,
              'text-slate-600 dark:text-slate-400': !isActive && !isHome,
            })}
          />
          
          {item.name === 'Membros' && hasNotifications && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {pendingCount + visitorsCount}
            </span>
          )}
        </div>

        {!isHome && (
          <span
            className={clsx(
              'w-full truncate px-1 text-center text-[10px] font-medium transition-all duration-200',
              isActive ? 'font-semibold text-amber-500' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {item.name}
          </span>
        )}

        {isActive && !isHome && (
          <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-amber-500" />
        )}
      </button>
    )
  }

  return (
    <nav
      className={clsx(
        'mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 rounded-t-[2.5rem] border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden',
        className
      )}
    >
      <div className="mx-auto max-w-md px-2">
        <div className="flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-around">
            {leftItems.map(renderNavItem)}
          </div>
          
          <div className="flex w-20 justify-center">
            {homeItem && renderNavItem(homeItem)}
          </div>

          <div className="flex flex-1 items-center justify-around">
            {rightItems.map(renderNavItem)}
          </div>
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}


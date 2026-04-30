'use client'

import { usePathname } from 'next/navigation'
import { useNavigation } from '@/hooks/useNavigation'
import { usePermissions } from '@/hooks/usePermissions'
import { ROUTES } from '@/paths'
import clsx from 'clsx'
import { MessageSquare, Heart, Calendar, Users, Home } from 'lucide-react'

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
    name: 'Início',
    href: ROUTES.AUTHENTICATED.HOME, // Será tratado dinamicamente no componente
    icon: Home,
    isActive: (pathname) => pathname === ROUTES.AUTHENTICATED.HOME,
    permission: 'canViewDashboardOverview',
  },
  {
    name: 'Início',
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
    name: 'Perfil',
    href: ROUTES.AUTHENTICATED.PROFILE,
    icon: Users,
    isActive: (pathname) => pathname.startsWith(ROUTES.AUTHENTICATED.PROFILE),
  },
]

interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { navigateTo } = useNavigation()
  const { permissions } = usePermissions()

  const handleNavigation = (href: string) => {
    navigateTo(href)
  }

  const filteredNavigation = navigationItems.filter((item) => {
    // Lógica especial para o botão Início duplicado
    if (item.name === 'Início') {
      if (item.href === ROUTES.AUTHENTICATED.HOME) return permissions.canViewDashboardOverview
      if (item.href === ROUTES.AUTHENTICATED.MURAL) return !permissions.canViewDashboardOverview
    }

    if (!item.permission) return true
    return (permissions as any)[item.permission]
  })

  return (
    <nav
      className={`mobile-bottom-nav ios-no-backdrop fixed right-0 bottom-0 left-0 z-40 rounded-t-3xl border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden dark:border-slate-800 dark:bg-slate-900/95 ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-start justify-around">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const mainButton = item.name === 'Início'
            const isActive = item.isActive
              ? item.isActive(pathname) && !mainButton
              : pathname === item.href

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={clsx(
                  'group relative flex flex-col items-center justify-center space-y-1 rounded-lg px-3 py-2 transition-all duration-200',
                  {
                    'text-amber-500': isActive,
                    'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white':
                      !isActive,
                    'bg-slate-950 -mt-6 h-18 w-18 !rounded-full border border-slate-800 shadow-xl':
                      mainButton,
                    '!border-amber-800': mainButton && item.isActive && item.isActive(pathname),
                  },
                )}
              >
                <div
                  className={clsx('relative rounded-lg p-1 transition-all duration-200', {
                    'bg-amber-500/10 scale-110': isActive && !mainButton,
                    'group-hover:bg-slate-100 dark:group-hover:bg-slate-800':
                      !isActive && !mainButton,
                    // '': mainButton,
                    // '': mainButton && item.isActive && item.isActive(pathname),
                  })}
                >
                  <Icon
                    className={clsx('h-5 w-5 transition-all duration-200', {
                      'text-amber-500': isActive || mainButton,
                      'text-slate-600 dark:text-slate-400': !isActive && !mainButton,
                      'scale-150': mainButton,
                    })}
                  />
                </div>

                {!mainButton && (
                  <span
                    className={`text-[10px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-amber-500 font-semibold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.name}
                  </span>
                )}

                {isActive && !mainButton && (
                  <div className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-amber-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-slate-900/95" />
    </nav>
  )
}

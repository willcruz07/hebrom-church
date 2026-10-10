'use client'

import { usePathname } from 'next/navigation'
import { useNavigation } from '@/hooks/useNavigation'
import { usePermissions } from '@/hooks/usePermissions'
import { ROUTES } from '@/paths'
import { useNewUsersStore } from '@/store/useNewUsersStore'
import clsx from 'clsx'
import {
  MessageSquare,
  Heart,
  Calendar,
  Settings,
  Home,
  Users,
  BookOpen,
  IdCard,
} from 'lucide-react'
import { useAuth } from '@/store/useAuth'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: (pathname: string) => boolean
}

const startsWith = (route: string) => (pathname: string) => pathname.startsWith(route)

const NAV = {
  dailyWord: {
    name: 'Palavra',
    href: ROUTES.AUTHENTICATED.DAILY_WORD,
    icon: BookOpen,
    isActive: startsWith(ROUTES.AUTHENTICATED.DAILY_WORD),
  },
  mural: {
    name: 'Mural',
    href: ROUTES.AUTHENTICATED.MURAL,
    icon: MessageSquare,
    isActive: startsWith(ROUTES.AUTHENTICATED.MURAL),
  },
  prayer: {
    name: 'Oração',
    href: ROUTES.AUTHENTICATED.PRAYER,
    icon: Heart,
    isActive: startsWith(ROUTES.AUTHENTICATED.PRAYER),
  },
  members: {
    name: 'Membros',
    href: ROUTES.AUTHENTICATED.MEMBERS,
    icon: Users,
    isActive: startsWith(ROUTES.AUTHENTICATED.MEMBERS),
  },
  dashboardHome: {
    name: 'Home',
    href: ROUTES.AUTHENTICATED.HOME,
    icon: Home,
    isActive: (pathname) => pathname === ROUTES.AUTHENTICATED.HOME,
  },
  muralHome: {
    name: 'Home',
    href: ROUTES.AUTHENTICATED.MURAL,
    icon: Home,
    isActive: (pathname) =>
      pathname === ROUTES.AUTHENTICATED.MURAL || pathname === ROUTES.AUTHENTICATED.HOME,
  },
  agenda: {
    name: 'Agenda',
    href: ROUTES.AUTHENTICATED.AGENDA,
    icon: Calendar,
    isActive: startsWith(ROUTES.AUTHENTICATED.AGENDA),
  },
  idCard: {
    name: 'Carteirinha',
    href: ROUTES.AUTHENTICATED.ID_CARD,
    icon: IdCard,
    isActive: startsWith(ROUTES.AUTHENTICATED.ID_CARD),
  },
  settings: {
    name: 'Configuração',
    href: ROUTES.AUTHENTICATED.PROFILE,
    icon: Settings,
    isActive: startsWith(ROUTES.AUTHENTICATED.PROFILE),
  },
} satisfies Record<string, NavItem>

/**
 * Itens da barra por papel: [esquerda..., home central, ...direita].
 * O perfil/configuração fica no avatar do header (e no menu ☰) para quem não é visitante.
 */
function getNavLayout(
  isVisitor: boolean,
  permissions: ReturnType<typeof usePermissions>['permissions'],
): { left: NavItem[]; home: NavItem | null; right: NavItem[] } {
  // Visitante não tem menu ☰ nem carteirinha: mantém mural e configuração na barra
  if (isVisitor) {
    return { left: [], home: null, right: [NAV.mural, NAV.dailyWord, NAV.agenda, NAV.settings] }
  }
  // Membro pendente ainda não pode pedir oração nem tem carteirinha
  const idCardOrSettings = permissions.canViewProfileCard ? NAV.idCard : NAV.settings
  if (permissions.canManageUsers) {
    return {
      left: [NAV.dailyWord, NAV.members],
      home: NAV.dashboardHome,
      right: [NAV.agenda, idCardOrSettings],
    }
  }
  return {
    left: permissions.canRequestPrayer ? [NAV.dailyWord, NAV.prayer] : [NAV.dailyWord],
    home: NAV.muralHome,
    right: [NAV.agenda, idCardOrSettings],
  }
}

interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const currentUser = useAuth((s) => s.currentUser)
  const pathname = usePathname()
  const { navigateTo } = useNavigation()
  const { permissions, isVisitor } = usePermissions()
  const { pendingCount, visitorsCount } = useNewUsersStore()

  const hasNotifications = pendingCount > 0 || visitorsCount > 0

  const handleNavigation = (href: string) => {
    navigateTo(href)
  }

  const {
    left: leftItems,
    home: homeItem,
    right: rightItems,
  } = getNavLayout(isVisitor, permissions)

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const isHome = item.name === 'Home'
    const isActive = item.isActive ? item.isActive(pathname) : pathname === item.href

    return (
      <button
        key={item.href}
        onClick={() => handleNavigation(item.href)}
        className={clsx(
          'group relative flex flex-col items-center justify-center transition-all duration-200',
          {
            'text-amber-500': isActive,
            'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white':
              !isActive,
            '!border-amber-500': isHome && isActive,
            'bg-slate-950 -mt-8 h-16 w-16 !rounded-full border-1 shadow-xl z-50 border-slate-900':
              isHome,
            'w-16 space-y-1': !isHome,
          },
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
              isActive ? 'font-semibold text-amber-500' : 'text-slate-500 dark:text-slate-400',
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
        className,
      )}
    >
      <div className="mx-auto max-w-md px-2">
        <div className="flex h-16 items-center justify-between">
          {currentUser?.role && currentUser?.role !== 'visitor' ? (
            <>
              <div className="flex flex-1 items-center justify-around">
                {leftItems.map(renderNavItem)}
              </div>

              <div className="flex w-20 justify-center">{homeItem && renderNavItem(homeItem)}</div>

              <div className="flex flex-1 items-center justify-around">
                {rightItems.map(renderNavItem)}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-around">
              {rightItems.map(renderNavItem)}
            </div>
          )}
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

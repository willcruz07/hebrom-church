/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useNavigation } from '@/hooks/useNavigation'
import { usePermissions } from '@/hooks/usePermissions'
import { getPendingUsersCount } from '@/services/firebase/users'
import { ROUTES } from '@/paths'
import { useAuth } from '@/store/useAuth'
import { useMenuState } from '@/store/useMenuState'
import {
  LayoutDashboard,
  LogOut,
  Settings,
  MessageSquare,
  Heart,
  Calendar,
  Users,
  User,
  X,
  Layers,
  IdCard,
} from 'lucide-react'
import { useWindowSize } from 'usehooks-ts'
import { Sheet, SheetContent } from './ui/sheet'

interface SidebarProps {
  className?: string
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: ROUTES.AUTHENTICATED.HOME,
    icon: LayoutDashboard,
    description: 'Visão geral',
    permission: 'canViewDashboardOverview',
  },
  {
    name: 'Mural',
    href: ROUTES.AUTHENTICATED.MURAL,
    icon: MessageSquare,
    description: 'Avisos e comunicados',
    permission: 'canViewGeneralFeed',
  },
  {
    name: 'Oração',
    href: ROUTES.AUTHENTICATED.PRAYER,
    icon: Heart,
    description: 'Pedidos de oração',
    permission: 'canRequestPrayer',
  },
  {
    name: 'Agenda',
    href: ROUTES.AUTHENTICATED.AGENDA,
    icon: Calendar,
    description: 'Eventos da igreja',
    permission: 'canViewAgenda',
  },
  {
    name: 'Membros',
    href: ROUTES.AUTHENTICATED.MEMBERS,
    icon: Users,
    description: 'Banco de membros',
    permission: 'canManageUsers',
  },
  {
    name: 'Grupos',
    href: ROUTES.AUTHENTICATED.GROUPS,
    icon: Layers,
    description: 'Segmentações',
    permission: 'canManageUsers',
  },
  {
    name: 'Carteirinha',
    href: ROUTES.AUTHENTICATED.ID_CARD,
    icon: IdCard,
    description: 'ID Digital de Membro',
    permission: 'canViewProfileCard',
  },
]

export function Sidebar({ className }: SidebarProps) {
  const { currentUser, signOut } = useAuth()
  const { onShowMessage } = useMessages()
  const { navigateTo } = useNavigation()
  const { permissions, role: userRole } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()
  const { width } = useWindowSize()
  const { menuIsOpen, setMenuIsOpen } = useMenuState()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (permissions.canManageUsers) {
      const unsubscribe = getPendingUsersCount(setPendingCount)
      return () => unsubscribe()
    }
  }, [permissions.canManageUsers])

  const filteredNavigation = navigationItems.filter((item) => {
    if (!item.permission) return true
    return (permissions as any)[item.permission]
  })

  const [activeRoute, setActiveRoute] = useState<string>('')
  const [menuIsFixed, setMenuIsFixed] = useState<boolean>(false)

  useEffect(() => {
    setActiveRoute(pathname)
  }, [pathname])

  useEffect(() => {
    const isDesktop = width >= 1024
    setMenuIsFixed(isDesktop)
    if (isDesktop) {
      setMenuIsOpen(false)
    }
  }, [width, setMenuIsOpen])

  const isActiveRoute = (route: string) => {
    if (route === ROUTES.AUTHENTICATED.HOME) {
      return activeRoute === route
    }
    return activeRoute === route || activeRoute.startsWith(route + '/')
  }

  const handleSignOut = useCallback(() => {
    onShowMessage({
      buttonText: 'Sair',
      messageType: 'warning',
      type: 'QUESTION',
      title: 'Confirmar Saída',
      description: 'Deseja realmente sair da aplicação?',
      onConfirm: async () => {
        await signOut()
        router.replace(ROUTES.NO_AUTH.SIGN_IN)
      },
    })
  }, [onShowMessage, router, signOut])

  const handleNavigation = (href: string) => {
    navigateTo(href)
    if (!menuIsFixed) {
      setMenuIsOpen(false)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-6 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="relative ml-4 -mb-16 h-56 w-56 -mt-16">
            <img
              src="/logo.png"
              alt="Hebrom Church"
              className="h-full w-full object-contain object-left mix-blend-screen brightness-150 contrast-125"
            />
          </div>

          {!menuIsFixed && (
            <button
              onClick={() => setMenuIsOpen(false)}
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 p-6 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600">
            {currentUser?.profile.avatar_url ? (
              <img
                src={currentUser.profile.avatar_url}
                alt={currentUser.profile.full_name || currentUser.email || 'Usuário'}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-blue-600 dark:text-slate-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900 dark:text-white">
              {currentUser?.profile.full_name || 'Usuário'}
            </p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {userRole === 'visitor' && 'Visitante'}
              {userRole === 'member' && 'Membro'}
              {userRole === 'secretary' && 'Secretária'}
              {userRole === 'pastor' && 'Pastor'}
              {userRole === 'pending_member' && 'Pendente'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = isActiveRoute(item.href)

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`group flex w-full cursor-pointer items-center space-x-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 shadow-blue-500/25 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.name}</p>
                <p
                  className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-500'}`}
                >
                  {item.description}
                </p>
              </div>
              {item.name === 'Membros' && pendingCount > 0 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {pendingCount}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={() => handleNavigation(ROUTES.AUTHENTICATED.PROFILE)}
          className="flex w-full cursor-pointer items-center space-x-3 rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Configurações</span>
        </button>
        <button
          onClick={handleSignOut}
          className="mt-2 flex w-full cursor-pointer items-center space-x-3 rounded-xl px-4 py-3 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  )

  if (menuIsFixed) {
    return (
      <aside className={`h-full w-80 ${className}`}>
        <SidebarContent />
      </aside>
    )
  }

  return (
    <Sheet open={menuIsOpen} onOpenChange={setMenuIsOpen}>
      <SheetContent side="left" className="w-80 p-0 border-none">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

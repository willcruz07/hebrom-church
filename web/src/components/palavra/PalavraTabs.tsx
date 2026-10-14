'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES, matchesRoute } from '@/paths'
import { cn } from '@/lib/utils'

// A aba "Devocional" entra aqui quando o módulo existir
const TABS = [
  { label: 'Palavra do Dia', href: ROUTES.AUTHENTICATED.DAILY_WORD },
  { label: 'Bíblia', href: ROUTES.AUTHENTICATED.BIBLE },
]

/** Abas da seção Palavra — cada aba é uma rota. */
export function PalavraTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Seção Palavra"
      className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 md:w-[320px]"
    >
      {TABS.map((tab) => {
        const active = matchesRoute(tab.href, pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-1.5 text-center text-xs font-semibold transition-colors',
              active
                ? 'bg-white text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

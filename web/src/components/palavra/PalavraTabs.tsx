'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Book, BookOpen } from 'lucide-react'
import { ROUTES, matchesRoute } from '@/paths'
import { cn } from '@/lib/utils'

// A aba "Devocional" entra aqui quando o módulo existir
const TABS = [
  { label: 'Palavra do Dia', href: ROUTES.AUTHENTICATED.DAILY_WORD, icon: BookOpen },
  { label: 'Bíblia', href: ROUTES.AUTHENTICATED.BIBLE, icon: Book },
]

/** Abas da seção Palavra — cada aba é uma rota. */
export function PalavraTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Seção Palavra"
      className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800 md:w-[440px]"
    >
      {TABS.map((tab) => {
        const active = matchesRoute(tab.href, pathname)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all md:h-12 md:text-base',
              active
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import { UserAvatar } from '@/components/ui/UserAvatar'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import type { KidSession } from '@/types'

/** Área Kids aberta ou fechada, e quem está servindo. `session` já vem sem sessão "velha". */
export function KidsStatusCard({ session }: { session: KidSession | null }) {
  const open = !!session
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border p-4',
        open
          ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-900/10'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
      )}
    >
      <span className={cn('h-3 w-3 shrink-0 rounded-full', open ? 'animate-pulse bg-emerald-500' : 'bg-slate-300')} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900 dark:text-white">
          {open ? `Área Kids aberta desde ${dayjs(session.opened_at.toDate()).format('HH:mm')}` : 'Área Kids fechada no momento'}
        </p>
        {open && session.staff.length > 0 && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Servindo: {session.staff.map((s) => s.name.split(' ')[0]).join(', ')}
          </p>
        )}
      </div>
      {open && (
        <div className="flex -space-x-2">
          {session.staff.slice(0, 4).map((s) => (
            <UserAvatar key={s.uid} src={s.avatar_url} name={s.name} size={32} className="ring-2 ring-white dark:ring-slate-900" />
          ))}
        </div>
      )}
    </div>
  )
}

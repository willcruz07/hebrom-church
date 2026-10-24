'use client'

import { AlertTriangle } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatAge } from '@/lib/kids/age'
import { alertsOf } from '@/lib/kids/health'
import { roomLabelOf } from '@/lib/kids/rooms'
import type { KidChild } from '@/types'
import { kidsToday } from './kids-today'

interface KidCardProps {
  child: KidChild
  /** Linha extra, ex.: "Responsáveis: João e Maria". */
  subtitle?: string
  onClick: () => void
}

export function KidCard({ child, subtitle, onClick }: KidCardProps) {
  const today = kidsToday()
  const alerts = alertsOf(child.health).length

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-amber-400 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <UserAvatar src={child.photo_url} name={child.name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900 dark:text-white">
          {child.name}
          {child.is_visitor && (
            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase text-slate-500 dark:bg-slate-800">
              Visitante
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatAge(child.birth_date, today)} · {roomLabelOf(child.birth_date, today)}
        </p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      {alerts > 0 && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          {alerts} {alerts === 1 ? 'alerta' : 'alertas'}
        </span>
      )}
    </button>
  )
}

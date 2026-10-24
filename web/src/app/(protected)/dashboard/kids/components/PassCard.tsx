'use client'

import { UserAvatar } from '@/components/ui/UserAvatar'
import dayjs from '@/lib/dayjs'
import { alertsOf } from '@/lib/kids/health'
import type { KidChild, KidPass } from '@/types'

const time = (stamp: { toDate(): Date } | undefined) => (stamp ? dayjs(stamp.toDate()).format('HH:mm') : '')

/** Criança na lista da Sala: alertas por extenso e horários. */
export function PassCard({ pass, child, onClick }: { pass: KidPass; child?: KidChild; onClick: () => void }) {
  const alerts = child ? alertsOf(child.health) : []
  const detail =
    pass.status === 'in'
      ? `Entrou ${time(pass.checked_in_at)} · deixado por ${pass.dropped_by.name}`
      : pass.status === 'out'
        ? `Saiu ${time(pass.checked_out_at)}${pass.picked_by ? ` · buscado por ${pass.picked_by.name}` : ''}`
        : 'Saída não registrada'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-amber-400 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <UserAvatar src={pass.child_photo_url} name={pass.child_name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900 dark:text-white">
          {pass.child_name}
          {pass.is_visitor && (
            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase text-slate-500 dark:bg-slate-800">
              Visitante
            </span>
          )}
        </p>
        {alerts.length > 0 && (
          <p className="text-xs font-bold text-red-600 dark:text-red-400">
            {alerts.map((a) => (a.detail ? `${a.label}: ${a.detail}` : a.label)).join(' · ')}
          </p>
        )}
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </button>
  )
}

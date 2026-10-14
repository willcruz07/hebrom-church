'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import {
  HEALTH_GROUPS,
  HEALTH_ITEMS,
  MAX_HEALTH_DETAIL,
  type KidHealth,
  type KidHealthItemId,
} from '@/lib/kids/health'
import { cn } from '@/lib/utils'

type HealthItem = (typeof HEALTH_ITEMS)[number]

interface HealthChipsProps {
  health: KidHealth
  onChange: (health: KidHealth) => void
  photoConsent: boolean
  onPhotoConsentChange: (value: boolean) => void
  errors?: Partial<Record<KidHealthItemId, string>>
}

/** Anamnese em chips; itens com "qual?" abrem um campo curto quando marcados. */
export function HealthChips({ health, onChange, photoConsent, onPhotoConsentChange, errors }: HealthChipsProps) {
  const toggle = (item: HealthItem) => {
    const next = { ...health }
    if (next[item.id] !== undefined) delete next[item.id]
    else next[item.id] = item.detail ? '' : true
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {HEALTH_GROUPS.map((group) => {
        const items = HEALTH_ITEMS.filter((item) => item.group === group.id)
        const openDetails = items.filter((item) => item.detail && health[item.id] !== undefined)
        return (
          <div key={group.id} className="space-y-2">
            <GroupLabel>{group.label}</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <Chip key={item.id} active={health[item.id] !== undefined} alert={item.alert} onClick={() => toggle(item)}>
                  {item.label}
                </Chip>
              ))}
            </div>
            {openDetails.map((item) => {
              const value = health[item.id]
              const error = errors?.[item.id]
              return (
                <div key={item.id} className="space-y-1">
                  <Input
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => onChange({ ...health, [item.id]: e.target.value })}
                    maxLength={MAX_HEALTH_DETAIL}
                    placeholder={`${item.label}: qual?`}
                    aria-invalid={!!error}
                    className={cn('rounded-xl', error && 'border-red-500 focus-visible:ring-red-500')}
                  />
                  {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                </div>
              )
            })}
          </div>
        )
      })}

      <div className="space-y-2">
        <GroupLabel>Autorizações</GroupLabel>
        <div className="flex flex-wrap gap-2">
          <Chip active={photoConsent} onClick={() => onPhotoConsentChange(!photoConsent)}>
            Pode ser fotografada (redes da igreja)
          </Chip>
        </div>
      </div>
    </div>
  )
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{children}</p>
}

function Chip({
  active,
  alert = false,
  onClick,
  children,
}: {
  active: boolean
  alert?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all active:scale-95',
        active
          ? 'border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-500/25'
          : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      {alert && <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : 'bg-red-500')} />}
      {children}
    </button>
  )
}

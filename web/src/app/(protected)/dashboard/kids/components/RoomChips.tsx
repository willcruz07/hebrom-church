'use client'

import { ROOMS, type RoomId } from '@/lib/kids/rooms'
import type { PassRoom } from '@/lib/kids/session'
import { cn } from '@/lib/utils'

/** Escolha de sala; "Fora das faixas" (13+) não tem chip — a tia escolhe uma das três. */
export function RoomChips({
  value,
  onChange,
  disabled = false,
}: {
  value: PassRoom
  onChange: (room: RoomId) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROOMS.map((room) => (
        <button
          key={room.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(room.id)}
          aria-pressed={value === room.id}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50',
            value === room.id
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
          )}
        >
          {room.label}
        </button>
      ))}
    </div>
  )
}

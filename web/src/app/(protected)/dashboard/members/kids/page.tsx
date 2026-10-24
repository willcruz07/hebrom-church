'use client'

import { useEffect, useMemo, useState } from 'react'
import { Baby, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { KidCard } from '@/components/kids/KidCard'
import { KidDetailModal } from '@/components/kids/KidDetailModal'
import { kidsToday } from '@/components/kids/kids-today'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import { PageTitle } from '@/components/ui/page-title'
import { alertsOf } from '@/lib/kids/health'
import { ROOMS, suggestRoom, type RoomId } from '@/lib/kids/rooms'
import { matchesKidSearch } from '@/lib/kids/stats'
import { useKidsStore } from '@/store/useKidsStore'
import { useMembersStore } from '@/store/useMembersStore'
import { MembersTabs } from '../components/MembersTabs'

type KidFilter = 'all' | RoomId | 'alerts' | 'visitors'

const FILTERS: { id: KidFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  ...ROOMS.map((room) => ({ id: room.id, label: room.label })),
  { id: 'alerts', label: 'Com alertas' },
  { id: 'visitors', label: 'Visitantes' },
]

export default function MembersKidsPage() {
  const { permissions } = usePermissions()
  const children = useKidsStore((s) => s.children)
  const loaded = useKidsStore((s) => s.loaded)
  const listenerError = useKidsStore((s) => s.error)
  const startKids = useKidsStore((s) => s.startListening)
  const members = useMembersStore((s) => s.members)
  const membersLoaded = useMembersStore((s) => s.loaded)
  const startMembers = useMembersStore((s) => s.startListening)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<KidFilter>('all')
  // id fica guardado ao fechar, para a ficha não esvaziar durante a animação de saída
  const [detail, setDetail] = useState<{ id: string | null; open: boolean }>({ id: null, open: false })

  // Só liga os listeners para quem pode ver a tela (a proteção real são as regras do Firestore)
  useEffect(() => {
    if (!permissions.canManageUsers) return
    startKids()
    startMembers()
  }, [permissions.canManageUsers, startKids, startMembers])

  useEffect(() => {
    if (listenerError) toast.error('Erro ao carregar crianças')
  }, [listenerError])

  const memberById = useMemo(() => new Map(members.map((m) => [m.uid, m])), [members])
  const guardianNames = (uids: string[]) =>
    uids.map((uid) => memberById.get(uid)?.profile.full_name).filter((n): n is string => !!n)

  const today = kidsToday()
  const filtered = useMemo(
    () =>
      children
        .filter((child) => {
          if (filter === 'alerts' && alertsOf(child.health).length === 0) return false
          if (filter === 'visitors' && !child.is_visitor) return false
          if (filter !== 'all' && filter !== 'alerts' && filter !== 'visitors' && suggestRoom(child.birth_date, today)?.id !== filter) return false
          const names = child.guardian_uids
            .map((uid) => memberById.get(uid)?.profile.full_name)
            .filter((n): n is string => !!n)
          return matchesKidSearch(search, [child.name, ...names])
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [children, filter, search, memberById, today],
  )

  const selected = children.find((c) => c.id === detail.id) ?? null

  return (
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
        <MembersTabs />
        <PageTitle
          title="Kids"
          description="Crianças cadastradas pelos responsáveis."
        />

        <div className="flex flex-col items-center gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por criança ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl bg-white pl-10 dark:bg-slate-900"
            />
          </div>
          <div className="no-scrollbar -mx-4 w-full overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0 md:w-auto">
            <div className="flex min-w-max items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 md:text-xs ${
                    filter === f.id
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 dark:shadow-none'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!loaded ? (
          <div className="flex justify-center py-20">
            <HebromSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
            <Baby className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              {children.length === 0 ? 'Nenhuma criança cadastrada ainda.' : 'Nenhuma criança encontrada.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((child) => {
              const names = guardianNames(child.guardian_uids)
              return (
                <KidCard
                  key={child.id}
                  child={child}
                  subtitle={names.length ? `Responsáveis: ${names.join(' e ')}` : undefined}
                  onClick={() => setDetail({ id: child.id, open: true })}
                />
              )
            })}
          </div>
        )}

        <KidDetailModal
          child={selected}
          open={detail.open && !!selected}
          onOpenChange={(open) => setDetail((d) => ({ ...d, open }))}
          guardianOf={(uid) => {
            if (!membersLoaded) return undefined
            const member = memberById.get(uid)
            if (!member) return null
            return {
              uid,
              name: member.profile.full_name,
              avatar_url: member.profile.avatar_url,
              ...(member.profile.phone ? { phone: member.profile.phone } : {}),
            }
          }}
          linkGuardians
        />
      </div>
    </PermissionGuard>
  )
}

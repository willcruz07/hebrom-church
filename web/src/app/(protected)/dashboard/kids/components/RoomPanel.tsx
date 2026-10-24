'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, LogIn, LogOut, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { KidDetailModal } from '@/components/kids/KidDetailModal'
import { useGuardianInfos } from '@/components/kids/useGuardianInfos'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { useMessages } from '@/hooks/useMessages'
import dayjs from '@/lib/dayjs'
import { ROOMS, type RoomId } from '@/lib/kids/rooms'
import { passesToClose, ROOM_LABELS, roomCounts, type EntryVia, type PassRoom, type Person, type PickedBy } from '@/lib/kids/session'
import { cn } from '@/lib/utils'
import {
  changeRoom,
  checkIn,
  checkOut,
  closeSession,
  openSession,
  setServing,
  subscribeToSessionPasses,
} from '@/services/firebase/kids-room'
import { useAuth } from '@/store/useAuth'
import { useKidsStore } from '@/store/useKidsStore'
import type { KidChild, KidPass, KidSession } from '@/types'
import { CheckInSheet } from './CheckInSheet'
import { CheckOutSheet } from './CheckOutSheet'
import { ManualCheckOutDialog } from './ManualCheckOutDialog'
import { PassCard } from './PassCard'
import { RoomChips } from './RoomChips'
import { roomErrorMessage } from './room-errors'
import { SignupQrDialog } from './SignupQrDialog'

type Filter = 'all' | RoomId

interface RoomPanelProps {
  session: KidSession | null
  /** Aberta há mais de 12 h: pede para encerrar. */
  stale: boolean
}

/** Sala da equipe Kids: abrir/encerrar, servir, entrada, saída e lista. */
export function RoomPanel({ session, stale }: RoomPanelProps) {
  const { currentUser } = useAuth()
  const { confirm } = useMessages()
  const children = useKidsStore((s) => s.children)
  const startKids = useKidsStore((s) => s.startListening)
  const [passState, setPassState] = useState<{ sessionId: string | null; passes: KidPass[] }>({ sessionId: null, passes: [] })
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState<'in' | 'out' | null>(null)
  const [signupOpen, setSignupOpen] = useState(false)
  const [showOut, setShowOut] = useState(false)
  // ids ficam guardados ao fechar, para o conteúdo não sumir durante a animação de saída
  const [detail, setDetail] = useState<{ childId: string | null; open: boolean }>({ childId: null, open: false })
  const [manual, setManual] = useState<{ childId: string | null; open: boolean }>({ childId: null, open: false })

  useEffect(() => {
    startKids()
  }, [startKids])

  const sessionId = session?.id ?? null
  useEffect(() => {
    if (!sessionId) return
    return subscribeToSessionPasses(
      sessionId,
      (passes) => setPassState({ sessionId, passes }),
      (error) => {
        console.error(error)
        toast.error('Erro ao carregar a sala')
      },
    )
  }, [sessionId])

  const passes = passState.sessionId === sessionId ? passState.passes : []
  const childById = useMemo(() => new Map(children.map((c) => [c.id, c])), [children])
  const counts = roomCounts(passes)
  const inRoom = passes
    .filter((p) => p.status === 'in' && (filter === 'all' || p.room === filter))
    .sort((a, b) => a.child_name.localeCompare(b.child_name, 'pt-BR'))
  const left = passes
    .filter((p) => p.status !== 'in')
    .sort((a, b) => (b.checked_out_at?.toMillis() ?? 0) - (a.checked_out_at?.toMillis() ?? 0))

  const detailPass = passes.find((p) => p.child_id === detail.childId) ?? null
  const detailChild = detail.childId ? childById.get(detail.childId) ?? null : null
  const detailGuardians = useGuardianInfos(detailChild?.guardian_uids ?? [])
  const manualPass = passes.find((p) => p.child_id === manual.childId) ?? null

  if (!currentUser) return null
  const me: Person = { uid: currentUser.uid, name: currentUser.profile.full_name }
  const member = { ...me, avatar_url: currentUser.profile.avatar_url }
  const serving = !!session && session.staff_uids.includes(me.uid)

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true)
    try {
      await action()
      toast.success(success)
      return true
    } catch (error) {
      console.error(error)
      toast.error(roomErrorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  const close = async () => {
    if (!session) return
    const remaining = passesToClose(passes).length
    const confirmed = await confirm({
      title: 'Encerrar Área Kids',
      description: remaining
        ? `${remaining} crianças ainda estão na sala e ficarão como saída não registrada.`
        : 'Encerrar a Área Kids?',
      confirmText: 'Encerrar',
      destructive: true,
    })
    if (confirmed) await run(() => closeSession(session.id, member), 'Área Kids encerrada')
  }

  const registerEntries = (entries: { child: KidChild; room: PassRoom }[], droppedBy: Person, via: EntryVia) =>
    session
      ? run(
          () => checkIn(session.id, entries, droppedBy, me, via),
          entries.length === 1 ? 'Entrada registrada' : `${entries.length} entradas registradas`,
        )
      : Promise.resolve(false)

  const registerExit = (childIds: string[], picked: PickedBy, via: EntryVia) =>
    session
      ? run(
          () => checkOut(session.id, childIds, picked, me, via),
          childIds.length === 1 ? 'Saída registrada' : `${childIds.length} saídas registradas`,
        )
      : Promise.resolve(false)

  if (!session) {
    return (
      <div className="space-y-4 rounded-2xl border-2 border-dashed border-amber-200 p-8 text-center dark:border-amber-900/50">
        <p className="text-sm text-slate-500">A Área Kids está fechada.</p>
        <Button
          type="button"
          disabled={busy}
          onClick={() => run(() => openSession(member), 'Área Kids aberta')}
          className="h-14 w-full max-w-sm rounded-2xl bg-amber-600 text-base font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95"
        >
          {busy ? <HebromSpinner size="sm" className="brightness-200" /> : 'Abrir Área Kids'}
        </Button>
      </div>
    )
  }

  if (stale) {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/50 dark:bg-amber-900/10">
        <p className="font-semibold text-amber-900 dark:text-amber-300">
          A Área Kids está aberta desde {dayjs(session.opened_at.toDate()).format('ddd DD/MM [às] HH:mm')}. Encerrar?
        </p>
        <Button
          type="button"
          disabled={busy}
          onClick={close}
          className="h-11 rounded-xl bg-amber-600 px-8 font-black text-white hover:bg-amber-700"
        >
          Encerrar
        </Button>
      </div>
    )
  }

  const tile = (label: string, value: number, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl px-3 py-2 text-left transition-all active:scale-95',
        active ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25' : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800',
      )}
    >
      <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
      <span className="block text-lg font-black">{value}</span>
    </button>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => run(() => setServing(session.id, member, !serving), serving ? 'Você saiu do serviço' : 'Você está servindo')}
          className={cn(
            'h-11 rounded-xl px-5 font-bold',
            serving
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300',
          )}
        >
          {serving ? 'Sair do serviço' : 'Estou servindo'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSignupOpen(true)}
          className="h-11 gap-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <QrCode className="h-4 w-4" /> QR para criar conta
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={close}
          className="ml-auto h-11 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Encerrar
        </Button>
      </div>

      {!serving && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:bg-amber-900/15 dark:text-amber-300">
          Toque em Estou servindo para registrar entradas e saídas.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={!serving || busy}
          onClick={() => setSheet('in')}
          className="h-16 gap-2 rounded-2xl bg-amber-600 text-base font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95"
        >
          <LogIn className="h-5 w-5" /> Entrada
        </Button>
        <Button
          type="button"
          disabled={!serving || busy}
          onClick={() => setSheet('out')}
          className="h-16 gap-2 rounded-2xl bg-slate-900 text-base font-black text-white shadow-lg hover:bg-slate-800 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <LogOut className="h-5 w-5" /> Saída
        </Button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tile('Todas', counts.bercario + counts.kids + counts.juniores + counts.outside, filter === 'all', () => setFilter('all'))}
        {ROOMS.map((room) => tile(room.label, counts[room.id], filter === room.id, () => setFilter(room.id)))}
      </div>

      {inRoom.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-800">
          Nenhuma criança na sala{filter === 'all' ? '' : ` ${ROOM_LABELS[filter]}`}.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {inRoom.map((pass) => (
            <PassCard
              key={pass.child_id}
              pass={pass}
              child={childById.get(pass.child_id)}
              onClick={() =>
                childById.has(pass.child_id)
                  ? setDetail({ childId: pass.child_id, open: true })
                  : setManual({ childId: pass.child_id, open: true })
              }
            />
          ))}
        </div>
      )}

      {left.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowOut((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-500"
          >
            Já saíram ({left.length})
            <ChevronDown className={cn('h-4 w-4 transition-transform', showOut && 'rotate-180')} />
          </button>
          {showOut && (
            <div className="grid gap-3 opacity-80 sm:grid-cols-2">
              {left.map((pass) => (
                <PassCard
                  key={pass.child_id}
                  pass={pass}
                  child={childById.get(pass.child_id)}
                  onClick={() => childById.has(pass.child_id) && setDetail({ childId: pass.child_id, open: true })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <KidDetailModal
        child={detailChild}
        open={detail.open && !!detailChild}
        onOpenChange={(open) => setDetail((d) => ({ ...d, open }))}
        guardianOf={(uid) => detailGuardians[uid]}
        actions={
          detailPass?.status === 'in' ? (
            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Sala</p>
              <RoomChips
                value={detailPass.room}
                disabled={!serving || busy}
                onChange={(room) => run(() => changeRoom(session.id, detailPass.child_id, room), 'Sala alterada')}
              />
              <Button
                type="button"
                disabled={!serving || busy}
                onClick={() => {
                  setDetail((d) => ({ ...d, open: false }))
                  setManual({ childId: detailPass.child_id, open: true })
                }}
                className="h-11 w-full rounded-xl bg-amber-600 font-black text-white hover:bg-amber-700"
              >
                Registrar saída
              </Button>
            </div>
          ) : undefined
        }
      />

      <ManualCheckOutDialog
        pass={manualPass}
        open={manual.open && !!manualPass && serving}
        onOpenChange={(open) => setManual((m) => ({ ...m, open }))}
        onConfirm={(picked) => (manualPass ? registerExit([manualPass.child_id], picked, 'manual') : Promise.resolve(false))}
      />

      <CheckInSheet
        open={sheet === 'in'}
        onOpenChange={(open) => setSheet(open ? 'in' : null)}
        kids={children}
        passes={passes}
        staffUid={me.uid}
        onConfirm={registerEntries}
      />
      <CheckOutSheet
        open={sheet === 'out'}
        onOpenChange={(open) => setSheet(open ? 'out' : null)}
        passes={passes}
        onConfirm={(ids, picked) => registerExit(ids, picked, 'qr')}
      />
      <SignupQrDialog open={signupOpen} onOpenChange={setSignupOpen} />
    </div>
  )
}

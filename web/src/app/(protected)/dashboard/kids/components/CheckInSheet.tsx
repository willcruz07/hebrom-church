'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { kidsToday } from '@/components/kids/kids-today'
import { useGuardianInfos } from '@/components/kids/useGuardianInfos'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { checkInCandidates, childrenOf, droppedByOptions, roomFor, selectableEntries } from '@/lib/kids/checkin'
import type { EntryVia, PassRoom, Person } from '@/lib/kids/session'
import { matchesKidSearch } from '@/lib/kids/stats'
import { cn } from '@/lib/utils'
import { resolveQr } from '@/services/firebase/kids-room'
import type { KidChild, KidPass } from '@/types'
import { QrScannerView } from './QrScannerView'
import { QuickChildForm } from './QuickChildForm'
import { RoomChips } from './RoomChips'

export interface CheckInSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kids: KidChild[]
  passes: KidPass[]
  staffUid: string
  onConfirm: (entries: { child: KidChild; room: PassRoom }[], droppedBy: Person, via: EntryVia) => Promise<boolean>
}

type Stage =
  | { kind: 'scan' }
  | { kind: 'search' }
  | { kind: 'select'; adultUid: string | null; manualChildId?: string }
  | { kind: 'quick'; adultUid: string }

/** Entrada: lê o QR do adulto (ou busca pelo nome), marca as crianças e confirma. */
export function CheckInSheet({ open, onOpenChange, kids: children, passes, staffUid, onConfirm }: CheckInSheetProps) {
  const today = kidsToday()
  const [stage, setStage] = useState<Stage>({ kind: 'scan' })
  const [scanKey, setScanKey] = useState(0)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Record<string, PassRoom>>({})
  const [droppedByUid, setDroppedByUid] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStage({ kind: 'scan' })
      setMessage('')
      setSelected({})
      setSearch('')
    }
  }

  const adultUid = stage.kind === 'select' || stage.kind === 'quick' ? stage.adultUid : null
  const pool =
    stage.kind === 'select'
      ? stage.adultUid
        ? childrenOf(children, stage.adultUid)
        : children.filter((c) => c.id === stage.manualChildId)
      : []
  const candidates = checkInCandidates(pool, passes, today)
  const guardianUids = [...new Set([...(adultUid ? [adultUid] : []), ...pool.flatMap((c) => c.guardian_uids)])]
  const guardians = useGuardianInfos(guardianUids)
  const names = Object.fromEntries(guardianUids.map((uid) => [uid, guardians[uid]?.name]))
  // Quem outra tia já registrou sai da seleção (evita repetir o erro de "já está na sala")
  const entries = selectableEntries(selected, candidates)
  const selectedChildren = entries.map((e) => e.child)
  const options = droppedByOptions(selectedChildren.length ? selectedChildren : pool, names, adultUid)
  const droppedBy = options.find((o) => o.uid === droppedByUid) ?? null

  const enterSelect = (uid: string) => {
    const preset: Record<string, PassRoom> = {}
    for (const c of checkInCandidates(childrenOf(children, uid), passes, today)) {
      if (!c.alreadyIn) preset[c.child.id] = c.suggestedRoom
    }
    setSelected(preset)
    setDroppedByUid(uid)
    setStage({ kind: 'select', adultUid: uid })
  }

  const onScan = async (text: string) => {
    setMessage('')
    setChecking(true)
    try {
      const result = await resolveQr(text)
      if (result.ok) {
        enterSelect(result.uid)
        return
      }
      setMessage(
        result.reason === 'invalid'
          ? 'QR não reconhecido.'
          : 'Este QR foi substituído. Peça para a pessoa abrir o QR atual no app.',
      )
    } catch (error) {
      console.error(error)
      setMessage('Sem conexão. Tente de novo.')
    } finally {
      setChecking(false)
    }
    setScanKey((k) => k + 1)
  }

  const chooseByName = (child: KidChild) => {
    setSelected({ [child.id]: roomFor(child.birth_date, today) })
    setDroppedByUid(child.guardian_uids[0] ?? '')
    setStage({ kind: 'select', adultUid: null, manualChildId: child.id })
  }

  const toggle = (child: KidChild, room: PassRoom) =>
    setSelected((current) => {
      const next = { ...current }
      if (child.id in next) delete next[child.id]
      else next[child.id] = room
      return next
    })

  const confirm = async () => {
    if (stage.kind !== 'select') return
    if (!entries.length || !droppedBy) return
    setSaving(true)
    const ok = await onConfirm(entries, droppedBy, stage.adultUid ? 'qr' : 'manual')
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const searchResults = search.trim()
    ? children.filter((c) => matchesKidSearch(search, [c.name])).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).slice(0, 20)
    : []

  const adult = adultUid ? guardians[adultUid] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">Entrada</DialogTitle>
          <DialogDescription>
            {stage.kind === 'scan' && 'Leia o QR do responsável no app dele.'}
            {stage.kind === 'search' && 'Busque a criança pelo nome.'}
            {stage.kind === 'select' && 'Marque as crianças que vão ficar na sala.'}
            {stage.kind === 'quick' && 'Cadastro rápido da criança visitante.'}
          </DialogDescription>
        </DialogHeader>

        {stage.kind === 'scan' && (
          <QrScannerView
            key={scanKey}
            onResult={onScan}
            footer={
              <div className="space-y-2">
                {checking && (
                  <div className="flex justify-center">
                    <HebromSpinner size="sm" />
                  </div>
                )}
                {message && <p className="text-center text-sm font-semibold text-red-500">{message}</p>}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStage({ kind: 'search' })}
                  className="h-11 w-full gap-2 rounded-xl font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                >
                  <Search className="h-4 w-4" /> Buscar pelo nome
                </Button>
              </div>
            }
          />
        )}

        {stage.kind === 'search' && (
          <div className="space-y-3">
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome da criança"
              className="rounded-xl"
            />
            <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
              {searchResults.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => chooseByName(child)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2 text-left hover:border-amber-400 dark:border-slate-800"
                  >
                    <UserAvatar src={child.photo_url} name={child.name} size={36} />
                    <span className="truncate text-sm font-bold">{child.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <BackButton onClick={() => setStage({ kind: 'scan' })} />
          </div>
        )}

        {stage.kind === 'select' && (
          <div className="space-y-4">
            {stage.adultUid && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/15">
                <UserAvatar src={adult?.avatar_url} name={adult?.name} size={40} />
                <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{adult?.name ?? '…'}</span>
              </div>
            )}

            {candidates.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma criança cadastrada para este responsável.</p>
            ) : (
              <ul className="space-y-2">
                {candidates.map(({ child, suggestedRoom, alreadyIn }) => {
                  const checked = child.id in selected
                  return (
                    <li
                      key={child.id}
                      className={cn(
                        'space-y-2 rounded-xl border p-3',
                        checked ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-800',
                        alreadyIn && 'opacity-50',
                      )}
                    >
                      <button
                        type="button"
                        disabled={alreadyIn}
                        onClick={() => toggle(child, suggestedRoom)}
                        aria-pressed={checked}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-black',
                            checked ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300',
                          )}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <UserAvatar src={child.photo_url} name={child.name} size={36} />
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">{child.name}</span>
                        {alreadyIn && <span className="text-[10px] font-bold uppercase text-slate-500">Já está na sala</span>}
                      </button>
                      {checked && (
                        <RoomChips
                          value={selected[child.id]}
                          onChange={(room) => setSelected((s) => ({ ...s, [child.id]: room }))}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {stage.adultUid && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStage({ kind: 'quick', adultUid: stage.adultUid! })}
                className="h-11 w-full gap-2 rounded-xl border-2 border-dashed border-slate-200 font-bold text-slate-500 hover:border-amber-400 hover:text-amber-700 dark:border-slate-700"
              >
                <Plus className="h-4 w-4" /> Criança sem cadastro
              </Button>
            )}

            {options.length > 0 && selectedChildren.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Deixado por</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => (
                    <button
                      key={o.uid}
                      type="button"
                      onClick={() => setDroppedByUid(o.uid)}
                      aria-pressed={droppedByUid === o.uid}
                      className={cn(
                        'rounded-full border px-3 py-2 text-xs font-bold',
                        droppedByUid === o.uid
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                      )}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={confirm}
                disabled={saving || entries.length === 0 || !droppedBy}
                className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
              >
                {saving ? <HebromSpinner size="sm" className="brightness-200" /> : `Registrar entrada (${entries.length})`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelected({})
                  setScanKey((k) => k + 1)
                  setStage({ kind: 'scan' })
                }}
                className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
              >
                Ler outro QR
              </Button>
            </div>
          </div>
        )}

        {stage.kind === 'quick' && (
          <QuickChildForm
            adultUid={stage.adultUid}
            staffUid={staffUid}
            onCancel={() => setStage({ kind: 'select', adultUid: stage.adultUid })}
            onCreated={(childId, room) => {
              setSelected((s) => ({ ...s, [childId]: room }))
              setStage({ kind: 'select', adultUid: stage.adultUid })
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" onClick={onClick} className="h-10 gap-2 rounded-xl font-bold text-slate-500">
      <ArrowLeft className="h-4 w-4" /> Voltar para a câmera
    </Button>
  )
}

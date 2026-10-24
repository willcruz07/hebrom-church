'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import type { PickedBy } from '@/lib/kids/session'
import { cn } from '@/lib/utils'
import type { KidPass } from '@/types'
import { useGuardianInfos } from '@/components/kids/useGuardianInfos'

const OTHER = '__other__'

interface ManualCheckOutDialogProps {
  pass: KidPass | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (picked: PickedBy) => Promise<boolean>
}

/** Saída sem QR: um dos responsáveis ou "Outra pessoa" (nome digitado). */
export function ManualCheckOutDialog({ pass, open, onOpenChange, onConfirm }: ManualCheckOutDialogProps) {
  const guardians = useGuardianInfos(pass?.guardian_uids ?? [])
  const [choice, setChoice] = useState('')
  const [otherName, setOtherName] = useState('')
  const [saving, setSaving] = useState(false)

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setChoice(pass?.guardian_uids[0] ?? OTHER)
      setOtherName('')
    }
  }

  // Só responsáveis com nome carregado (nunca grava um nome provisório)
  const options = (pass?.guardian_uids ?? []).flatMap((uid) => {
    const name = guardians[uid]?.name
    return name ? [{ uid, name }] : []
  })
  const chosen = options.find((o) => o.uid === choice)
  const canConfirm = choice === OTHER ? otherName.trim().length > 0 : !!chosen

  const confirm = async () => {
    if (!canConfirm) return
    const picked: PickedBy = choice === OTHER || !chosen ? { name: otherName.trim() } : { uid: chosen.uid, name: chosen.name }
    setSaving(true)
    const ok = await onConfirm(picked)
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">Registrar saída</DialogTitle>
          <DialogDescription>{pass ? `Quem está buscando ${pass.child_name}?` : ''}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((o) => (
            <Choice key={o.uid} active={choice === o.uid} onClick={() => setChoice(o.uid)}>
              {o.name}
            </Choice>
          ))}
          <Choice active={choice === OTHER} onClick={() => setChoice(OTHER)}>
            Outra pessoa
          </Choice>
          {choice === OTHER && (
            <div className="space-y-2">
              <Input
                autoFocus
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                maxLength={80}
                placeholder="Nome de quem está buscando"
                className="rounded-xl"
              />
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Confirme a identidade de quem está buscando.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={confirm}
            disabled={!canConfirm || saving}
            className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
          >
            {saving ? <HebromSpinner size="sm" className="brightness-200" /> : 'Registrar saída'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-12 w-full items-center rounded-xl border px-4 text-left text-sm font-bold transition-colors',
        active
          ? 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
          : 'border-slate-200 text-slate-700 hover:border-amber-300 dark:border-slate-800 dark:text-slate-200',
      )}
    >
      {children}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { useGuardianInfos } from '@/components/kids/useGuardianInfos'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { PickedBy } from '@/lib/kids/session'
import { cn } from '@/lib/utils'
import { resolveQr } from '@/services/firebase/kids-room'
import type { KidPass } from '@/types'
import { QrScannerView } from './QrScannerView'

export interface CheckOutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  passes: KidPass[]
  onConfirm: (childIds: string[], picked: PickedBy) => Promise<boolean>
}

/** Saída pelo QR de quem veio buscar. */
export function CheckOutSheet({ open, onOpenChange, passes, onConfirm }: CheckOutSheetProps) {
  const [adultUid, setAdultUid] = useState<string | null>(null)
  const [scanKey, setScanKey] = useState(0)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const guardians = useGuardianInfos(adultUid ? [adultUid] : [])

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setAdultUid(null)
      setMessage('')
      setSelected([])
    }
  }

  const inRoomOf = (uid: string) => passes.filter((p) => p.status === 'in' && p.guardian_uids.includes(uid))
  const mine = adultUid ? inRoomOf(adultUid) : []

  const onScan = async (text: string) => {
    setMessage('')
    setChecking(true)
    try {
      const result = await resolveQr(text)
      if (!result.ok) {
        setMessage(result.reason === 'invalid' ? 'QR não reconhecido.' : 'Este QR foi substituído. Peça para a pessoa abrir o QR atual no app.')
      } else if (inRoomOf(result.uid).length === 0) {
        setMessage('Nenhuma criança deste responsável está na sala.')
      } else {
        setAdultUid(result.uid)
        setSelected(inRoomOf(result.uid).map((p) => p.child_id))
        return
      }
    } catch (error) {
      console.error(error)
      setMessage('Sem conexão. Tente de novo.')
    } finally {
      setChecking(false)
    }
    setScanKey((k) => k + 1)
  }

  const confirm = async () => {
    const name = adultUid ? guardians[adultUid]?.name : undefined
    if (!adultUid || !selected.length || !name) return
    setSaving(true)
    const ok = await onConfirm(selected, { uid: adultUid, name })
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const adult = adultUid ? guardians[adultUid] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">Saída</DialogTitle>
          <DialogDescription>
            {adultUid ? 'Confirme as crianças que estão saindo.' : 'Leia o QR de quem veio buscar.'}
          </DialogDescription>
        </DialogHeader>

        {!adultUid ? (
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
                <p className="text-center text-xs text-slate-500">
                  Sem QR? Toque na criança na lista da sala e use Registrar saída.
                </p>
              </div>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/15">
              <UserAvatar src={adult?.avatar_url} name={adult?.name} size={40} />
              <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{adult?.name ?? '…'}</span>
            </div>
            <ul className="space-y-2">
              {mine.map((pass) => {
                const checked = selected.includes(pass.child_id)
                return (
                  <li key={pass.child_id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected((s) => (checked ? s.filter((id) => id !== pass.child_id) : [...s, pass.child_id]))
                      }
                      aria-pressed={checked}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-3 text-left',
                        checked ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-800',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-black',
                          checked ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300',
                        )}
                      >
                        {checked ? '✓' : ''}
                      </span>
                      <UserAvatar src={pass.child_photo_url} name={pass.child_name} size={36} />
                      <span className="truncate text-sm font-bold">{pass.child_name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={confirm}
                disabled={saving || selected.length === 0 || !adult}
                className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
              >
                {saving ? <HebromSpinner size="sm" className="brightness-200" /> : `Registrar saída (${selected.length})`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAdultUid(null)
                  setScanKey((k) => k + 1)
                }}
                className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
              >
                Ler outro QR
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

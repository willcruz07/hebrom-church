'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { HealthChips } from '@/components/kids/HealthChips'
import { kidsToday } from '@/components/kids/kids-today'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatAge, isValidDate } from '@/lib/kids/age'
import { roomFor } from '@/lib/kids/checkin'
import { toChildFields } from '@/lib/kids/child'
import { QUICK_HEALTH_ITEM_IDS, type KidHealth } from '@/lib/kids/health'
import { roomLabelOf } from '@/lib/kids/rooms'
import type { PassRoom } from '@/lib/kids/session'
import { hasErrors, MAX_CHILD_NAME, validateChild, type ChildFormErrors, type ChildFormValues } from '@/lib/kids/validate'
import { cn } from '@/lib/utils'
import { createVisitorChild } from '@/services/firebase/kids-room'

interface QuickChildFormProps {
  /** Adulto escaneado: vira o responsável da criança. */
  adultUid: string
  staffUid: string
  onCreated: (childId: string, room: PassRoom) => void
  onCancel: () => void
}

/** Cadastro rápido de criança visitante, feito pela tia na entrada. */
export function QuickChildForm({ adultUid, staffUid, onCreated, onCancel }: QuickChildFormProps) {
  const today = kidsToday()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [health, setHealth] = useState<KidHealth>({})
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<ChildFormErrors>({})
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const values: ChildFormValues = {
      name,
      birth_date: birthDate,
      health,
      notes,
      photo_consent: false,
      guardian_uids: [adultUid],
    }
    const found = validateChild(values, today)
    setErrors(found)
    if (hasErrors(found)) return
    setSaving(true)
    try {
      const id = await createVisitorChild(toChildFields(values), staffUid)
      onCreated(id, roomFor(birthDate, today))
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível salvar. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  const validBirth = isValidDate(birthDate) && birthDate <= today

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nome da criança</Label>
          <Input
            autoFocus
            value={name}
            maxLength={MAX_CHILD_NAME}
            onChange={(e) => setName(e.target.value)}
            className={cn('rounded-xl', errors.name && 'border-red-500')}
          />
          {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Data de nascimento</Label>
          <Input
            type="date"
            max={today}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={cn('rounded-xl', errors.birth_date && 'border-red-500')}
          />
          {errors.birth_date ? (
            <p className="text-xs font-medium text-red-500">{errors.birth_date}</p>
          ) : (
            validBirth && (
              <p className="text-xs text-slate-500">
                {formatAge(birthDate, today)} · sala {roomLabelOf(birthDate, today)}
              </p>
            )
          )}
        </div>
      </div>

      <HealthChips health={health} onChange={setHealth} itemIds={QUICK_HEALTH_ITEM_IDS} errors={errors.health} />

      <div className="space-y-1.5">
        <Label>Observação (opcional)</Label>
        <Textarea value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} className="min-h-[72px] rounded-xl" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
        >
          {saving ? <HebromSpinner size="sm" className="brightness-200" /> : 'Cadastrar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

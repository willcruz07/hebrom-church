'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useMessages } from '@/hooks/useMessages'
import { KID_PHOTO } from '@/lib/image-specs'
import { formatAge, isValidDate } from '@/lib/kids/age'
import { toChildFields } from '@/lib/kids/child'
import { roomLabelOf } from '@/lib/kids/rooms'
import {
  hasErrors,
  MAX_CHILD_NAME,
  MAX_CHILD_NOTES,
  validateChild,
  type ChildFormErrors,
  type ChildFormValues,
} from '@/lib/kids/validate'
import { cn } from '@/lib/utils'
import { createChild, deleteChild, setChildPhoto, updateChild } from '@/services/firebase/kids'
import { useAuth } from '@/store/useAuth'
import type { KidChild } from '@/types'
import { GuardiansField } from './GuardiansField'
import { HealthChips } from './HealthChips'
import { kidsToday } from './kids-today'

interface KidFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` = nova criança. */
  child: KidChild | null
  /** Chamado depois de salvar ou remover (para recarregar a lista). */
  onSaved: () => void
}

const formFrom = (child: KidChild | null, uid: string): ChildFormValues => ({
  name: child?.name ?? '',
  birth_date: child?.birth_date ?? '',
  health: { ...(child?.health ?? {}) },
  notes: child?.notes ?? '',
  photo_consent: child?.photo_consent ?? false,
  guardian_uids: child ? [...child.guardian_uids] : [uid],
})

export function KidFormModal({ open, onOpenChange, child, onSaved }: KidFormModalProps) {
  const { currentUser } = useAuth()
  const { confirm } = useMessages()
  const uid = currentUser?.uid ?? ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ChildFormValues>(() => formFrom(child, uid))
  const [errors, setErrors] = useState<ChildFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)

  // Cada abertura começa do cadastro atual (ou vazio)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm(formFrom(child, uid))
      setErrors({})
      setPhoto(null)
      setPhotoPreview(null)
    }
  }

  useEffect(() => {
    if (!photoPreview) return
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const today = kidsToday()
  const update = (patch: Partial<ChildFormValues>) => setForm((f) => ({ ...f, ...patch }))

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Formato inválido', { description: 'Por favor, selecione uma imagem.' })
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string)
      setCropperOpen(true)
    })
    reader.readAsDataURL(file)
  }

  const save = async () => {
    // Ao criar, quem cadastra precisa continuar entre os responsáveis (regra do Firestore)
    const found = validateChild(form, today, child ? {} : { requiredGuardian: uid })
    setErrors(found)
    if (hasErrors(found) || !uid) return

    setSaving(true)
    try {
      const fields = toChildFields(form)
      let id = child?.id
      if (id) await updateChild(id, fields)
      else id = await createChild(fields, uid)

      if (photo) {
        try {
          await setChildPhoto(id, photo)
        } catch (error) {
          console.error(error)
          toast.error('Foto não enviada, tente de novo.')
        }
      }
      toast.success(child ? 'Cadastro atualizado' : 'Criança cadastrada')
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível salvar. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!child) return
    const confirmed = await confirm({
      title: 'Remover criança',
      description: `O cadastro e o prontuário de ${child.name} serão apagados.`,
      confirmText: 'Remover',
      destructive: true,
    })
    if (!confirmed) return
    try {
      await deleteChild(child.id)
      toast.success('Cadastro removido')
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível remover. Verifique sua conexão.')
    }
  }

  const validBirth = isValidDate(form.birth_date) && form.birth_date <= today

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent variant="sheet" className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-base font-black md:text-xl">
              {child ? child.name : 'Nova criança'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Só você, os outros responsáveis, a equipe Kids, a secretaria e o pastor veem estas informações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-full transition-transform active:scale-95"
                aria-label="Escolher foto"
              >
                <UserAvatar src={photoPreview ?? child?.photo_url} name={form.name} size={72} />
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
              <p className="text-xs text-slate-500">Uma foto ajuda a equipe Kids a reconhecer a criança.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  maxLength={MAX_CHILD_NAME}
                  onChange={(e) => update({ name: e.target.value })}
                  aria-invalid={!!errors.name}
                  className={cn('rounded-xl', errors.name && 'border-red-500')}
                />
                {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  max={today}
                  value={form.birth_date}
                  onChange={(e) => update({ birth_date: e.target.value })}
                  aria-invalid={!!errors.birth_date}
                  className={cn('rounded-xl', errors.birth_date && 'border-red-500')}
                />
                {errors.birth_date ? (
                  <p className="text-xs font-medium text-red-500">{errors.birth_date}</p>
                ) : (
                  validBirth && (
                    <p className="text-xs text-slate-500">
                      {formatAge(form.birth_date, today)} · sala {roomLabelOf(form.birth_date, today)}
                    </p>
                  )
                )}
              </div>
            </div>

            <HealthChips
              health={form.health}
              onChange={(health) => update({ health })}
              photoConsent={form.photo_consent}
              onPhotoConsentChange={(photo_consent) => update({ photo_consent })}
              errors={errors.health}
            />

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                maxLength={MAX_CHILD_NOTES}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Algo mais que a equipe Kids deve saber?"
                className="min-h-[96px] rounded-xl"
              />
              <p className="text-right text-[11px] text-slate-400">
                {form.notes.length}/{MAX_CHILD_NOTES}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Responsáveis</Label>
              <GuardiansField
                currentUid={uid}
                guardianUids={form.guardian_uids}
                canRemoveSelf={!!child}
                onChange={(guardian_uids) => update({ guardian_uids })}
                error={errors.guardians}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
            >
              {saving ? <HebromSpinner size="sm" className="brightness-200" /> : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
            >
              Cancelar
            </Button>
            {child && (
              <Button
                type="button"
                variant="ghost"
                onClick={remove}
                className="h-11 w-full gap-2 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 sm:order-first sm:mr-auto sm:w-auto"
              >
                <Trash2 className="h-4 w-4" /> Remover criança
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          onCropComplete={(blob) => {
            setPhoto(blob)
            setPhotoPreview(URL.createObjectURL(blob))
          }}
          spec={KID_PHOTO}
          title="Foto da criança"
        />
      )}
    </>
  )
}

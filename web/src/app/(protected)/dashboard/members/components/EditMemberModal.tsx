'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Edit, Check, UserMinus, UserCheck, Trash2 } from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { AppUser } from '@/types'
import { updateUserProfile } from '@/services/firebase/users'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { getGroups } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'
import { formatPhone, maskPhone } from '@/lib/utils'
import { deleteUser } from '@/services/firebase/users'

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  role: z.enum(['member', 'secretary', 'pastor', 'visitor', 'pending_member']),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  sub_groups: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: AppUser
  onSuccess: () => void
}

export function EditMemberModal({ isOpen, onClose, member, onSuccess }: EditMemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<ChurchGroup[]>([])
  const [inactivating, setInactivating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      full_name: member.profile.full_name,
      role: member.role,
      phone: member.profile.phone,
      birth_date: member.profile.birth_date,
      sub_groups: member.sub_groups || [],
    },
  })

  const selectedGroups = watch('sub_groups')

  useEffect(() => {
    if (isOpen) {
      getGroups().then(setGroups)
    }
  }, [isOpen])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value)
    setValue('phone', masked)
  }

  const toggleGroup = (groupId: string) => {
    const current = selectedGroups || []
    if (current.includes(groupId)) {
      setValue(
        'sub_groups',
        current.filter((id) => id !== groupId),
      )
    } else {
      setValue('sub_groups', [...current, groupId])
    }
  }

  const handleToggleStatus = async () => {
    setInactivating(true)
    try {
      const docRef = doc(db, 'users', member.uid)
      const newStatus = !member.is_active
      await updateDoc(docRef, {
        is_active: newStatus,
        updated_at: Timestamp.now(),
      })
      toast.success(newStatus ? 'Usuário ativado!' : 'Usuário inativado!')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      toast.error('Erro ao alterar status')
    } finally {
      setInactivating(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // 1. Atualizar Perfil
      await updateUserProfile(member.uid, {
        full_name: data.full_name,
        phone: data.phone,
        birth_date: data.birth_date,
      })

      // 2. Atualizar Role e Grupos
      const docRef = doc(db, 'users', member.uid)
      await updateDoc(docRef, {
        role: data.role,
        sub_groups: data.sub_groups,
        updated_at: Timestamp.now(),
      })

      toast.success('Dados atualizados com sucesso!')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar dados'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-amber-600" />
            Editar Membro
          </DialogTitle>
          <DialogDescription>Alterar informações de {member.profile.full_name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Nome Completo</Label>
            <Input id="edit_full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo / Permissão</Label>
              <Select
                onValueChange={(v) => setValue('role', v as FormData['role'])}
                defaultValue={member.role}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="secretary">Secretária</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="visitor">Visitante</SelectItem>
                  <SelectItem value="pending_member">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input id="edit_phone" {...register('phone')} onChange={handlePhoneChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
            <Input id="edit_birth_date" type="date" {...register('birth_date')} />
          </div>

          <div className="space-y-3">
            <Label>Sub-Grupos / Ministérios</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    selectedGroups?.includes(group.id)
                      ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      selectedGroups?.includes(group.id)
                        ? 'bg-white/20 border-white/40'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {selectedGroups?.includes(group.id) && <Check className="h-3 w-3" />}
                  </div>
                  {group.name}
                </button>
              ))}
              {groups.length === 0 && (
                <p className="text-xs text-slate-500 col-span-2 py-2">Nenhum grupo cadastrado.</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleStatus}
                disabled={inactivating}
                className={`gap-2 rounded-xl transition-all ${
                  member.is_active
                    ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 border-amber-100'
                    : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-100'
                }`}
              >
                {inactivating ? (
                  <HebromSpinner size="sm" />
                ) : member.is_active ? (
                  <UserMinus className="h-4 w-4" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                {member.is_active ? 'Inativar' : 'Reativar'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (confirm('Tem certeza que deseja excluir permanentemente este usuário?')) {
                    try {
                      await deleteUser(member.uid)
                      toast.success('Usuário excluído com sucesso')
                      onSuccess()
                      onClose()
                    } catch (error) {
                      toast.error('Erro ao excluir usuário')
                    }
                  }
                }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100 gap-2 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              {member.is_active
                ? 'Inativar remove o acesso temporariamente. Excluir é permanente.'
                : 'O usuário recuperará o acesso ao sistema.'}
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? <HebromSpinner size="sm" className="mr-2 brightness-200" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

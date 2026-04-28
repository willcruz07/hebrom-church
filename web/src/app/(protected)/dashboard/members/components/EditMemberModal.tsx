'use client'

import { useState } from 'react'
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
import { Edit, Loader2 } from 'lucide-react'
import { AppUser } from '@/types'
import { updateUserProfile } from '@/services/firebase/users'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/config'

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  role: z.enum(['member', 'secretary', 'pastor', 'visitor', 'pending_member']),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: member.profile.full_name,
      role: member.role,
      phone: member.profile.phone,
      birth_date: member.profile.birth_date,
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // 1. Atualizar Perfil
      await updateUserProfile(member.uid, {
        full_name: data.full_name,
        phone: data.phone,
        birth_date: data.birth_date,
      })

      // 2. Atualizar Role (Se mudou)
      if (data.role !== member.role) {
        const docRef = doc(db, 'users', member.uid)
        await updateDoc(docRef, {
          role: data.role,
          updated_at: Timestamp.now(),
        })
      }

      toast.success('Dados atualizados com sucesso!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
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
              <Select onValueChange={(v) => setValue('role', v as any)} defaultValue={member.role}>
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
              <Input id="edit_phone" {...register('phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
            <Input id="edit_birth_date" type="date" {...register('birth_date')} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Users, Edit } from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { updateGroup } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'

const schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EditGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  group: ChurchGroup
}

export function EditGroupModal({ isOpen, onClose, onSuccess, group }: EditGroupModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: group.name,
      description: group.description || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await updateGroup(group.id, data)
      toast.success('Grupo atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar grupo'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-amber-600" />
            Editar Grupo / Ministério
          </DialogTitle>
          <DialogDescription>Altere os dados do grupo {group.name}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit_name">Nome do Grupo</Label>
            <Input
              id="edit_name"
              {...register('name')}
              placeholder="Ex: Jovens, Louvor, Infantil"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_description">Descrição (Opcional)</Label>
            <Textarea
              id="edit_description"
              {...register('description')}
              placeholder="Breve descrição do ministério..."
              rows={3}
            />
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

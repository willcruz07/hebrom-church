'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { agendaService } from '@/services/firebase/agenda'
import { toast } from 'sonner'
import { EventCategory } from '@/types'
import { ImagePlus, X, UploadCloud, Loader2 } from 'lucide-react'
import { useFirebaseStorage } from '@/services/firebase/storage'

const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  location: z.string().min(1, 'Local é obrigatório'),
  category: z.enum(['Culto', 'Homens', 'Mulheres', 'Jovens', 'Imersão', 'Batismo', 'Outro']),
  thumbnail_url: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const { uploadImage } = useFirebaseStorage()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      category: 'Culto',
    },
  })

  const category = watch('category')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: EventFormValues) => {
    try {
      let thumbnail_url = ''

      if (selectedFile) {
        setIsUploading(true)
        const path = `events/${Date.now()}_${selectedFile.name}`
        thumbnail_url = await uploadImage(selectedFile, path)
        setIsUploading(false)
      }

      await agendaService.createEvent({
        ...data,
        ...(thumbnail_url ? { thumbnail_url } : {}),
      })

      toast.success('Evento criado com sucesso!')
      handleClose()
      onSuccess()
    } catch (error) {
      toast.error('Erro ao criar evento')
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    reset()
    removeFile()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-base md:text-2xl font-black uppercase tracking-tight">
            Novo Evento
          </DialogTitle>
          <DialogDescription className="text-[10px] md:text-sm font-medium">
            Preencha os dados abaixo para cadastrar um novo evento na agenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-bold">
                Título do Evento
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ex: Culto de Celebração"
                className="rounded-xl border-slate-200 focus:ring-amber-500 dark:border-slate-800"
              />
              {errors.title && (
                <p className="text-xs font-medium text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="font-bold">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  className="rounded-xl border-slate-200 dark:border-slate-800"
                />
                {errors.date && (
                  <p className="text-xs font-medium text-red-500">{errors.date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="font-bold">
                  Hora
                </Label>
                <Input
                  id="time"
                  type="time"
                  {...register('time')}
                  className="rounded-xl border-slate-200 dark:border-slate-800"
                />
                {errors.time && (
                  <p className="text-xs font-medium text-red-500">{errors.time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="font-bold">
                Local
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Ex: Templo Sede"
                className="rounded-xl border-slate-200 dark:border-slate-800"
              />
              {errors.location && (
                <p className="text-xs font-medium text-red-500">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="category" className="font-bold">
                Categoria
              </Label>
              <Select
                onValueChange={(value) => setValue('category', value as EventCategory)}
                defaultValue="Culto"
              >
                <SelectTrigger className="rounded-xl w-full border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Culto">Culto</SelectItem>
                  <SelectItem value="Homens">Homens</SelectItem>
                  <SelectItem value="Mulheres">Mulheres</SelectItem>
                  <SelectItem value="Jovens">Jovens</SelectItem>
                  <SelectItem value="Imersão">Imersão</SelectItem>
                  <SelectItem value="Batismo">Batismo</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold">
                Descrição (Opcional)
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Detalhes importantes sobre a programação..."
                className="min-h-[100px] rounded-xl border-slate-200 focus:ring-amber-500 dark:border-slate-800"
              />
            </div>

            {/* Thumbnail Upload Area */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Thumbnail do Evento (Opcional)
              </Label>
              <div
                onClick={() => !previewUrl && fileInputRef.current?.click()}
                className={
                  z.string().safeParse(previewUrl).success
                    ? 'relative h-32 w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900/50'
                    : 'group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-amber-500/50 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-amber-500/30 dark:hover:bg-amber-900/10'
                }
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile()
                      }}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-amber-600 transition-colors">
                    <div className="rounded-full bg-white p-2.5 shadow-sm dark:bg-slate-800">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Clique para enviar uma foto</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-60">
                      PNG, JPG ou WEBP
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Sem foto, o evento aparece na agenda só com data, título e descrição.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="w-full sm:w-auto rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto rounded-xl bg-amber-600 px-8 py-6 sm:py-2 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95"
            >
              {isSubmitting || isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploading ? 'Enviando foto...' : 'Salvando...'}
                </div>
              ) : (
                'Criar Evento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

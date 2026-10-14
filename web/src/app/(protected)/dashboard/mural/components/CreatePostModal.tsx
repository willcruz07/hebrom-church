'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, UploadCloud } from 'lucide-react'
import dayjs from '@/lib/dayjs'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BANNER_IMAGE } from '@/lib/image-specs'
import { toast } from 'sonner'
import { useAuth } from '@/store/useAuth'
import { createPost } from '@/services/firebase/mural'
import { getGroups } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'

const postSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
  target_groups: z.array(z.string()),
  event_date: z.string().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const { currentUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [groups, setGroups] = useState<ChurchGroup[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      target_groups: [],
    },
  })

  const selectedGroups = watch('target_groups')

  useEffect(() => {
    if (isOpen) {
      const fetchGroups = async () => {
        setIsLoadingGroups(true)
        try {
          const data = await getGroups()
          setGroups(data)
        } catch (error) {
          toast.error('Erro ao carregar grupos')
        } finally {
          setIsLoadingGroups(false)
        }
      }
      fetchGroups()
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setImageToCrop(reader.result as string)
      reader.readAsDataURL(file)
    }
    // Permite escolher o mesmo arquivo de novo depois de cancelar o recorte
    e.target.value = ''
  }

  const handleCropComplete = (blob: Blob) => {
    setSelectedFile(new File([blob], 'banner.jpg', { type: 'image/jpeg' }))
    setPreviewImage(URL.createObjectURL(blob))
  }

  const onSubmit = async (data: PostFormValues) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para publicar.')
      return
    }

    setIsSaving(true)
    try {
      await createPost(
        {
          title: data.title,
          content: data.content,
          author: {
            uid: currentUser.uid,
            name: currentUser.profile.full_name || currentUser.email,
            avatar_url: currentUser.profile.avatar_url || '',
          },
          target_groups: data.target_groups,
          ...(data.event_date ? { event_date: data.event_date } : {}),
        },
        selectedFile || undefined,
      )

      toast.success('Aviso publicado com sucesso!')
      reset()
      setPreviewImage(null)
      setSelectedFile(null)
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error('Erro ao publicar aviso.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeImage = () => {
    setSelectedFile(null)
    setPreviewImage(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent variant="sheet" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base md:text-2xl font-black uppercase tracking-tight">
            Novo Aviso
          </DialogTitle>
          <DialogDescription className="text-[10px] md:text-sm font-medium">
            Preencha os dados abaixo para publicar um novo aviso no mural.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-title" className="font-bold">
                Título do Aviso
              </Label>
              <Input
                id="post-title"
                {...register('title')}
                placeholder="Ex: Culto Especial de Santa Ceia"
                aria-invalid={!!errors.title}
                className="rounded-xl border-slate-200 focus:ring-amber-500 dark:border-slate-800"
              />
              {errors.title && (
                <p className="text-xs font-medium text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Alcance (Grupos)</Label>
              <ChipMultiSelect
                title="Alcance do Aviso"
                triggerLabel="Geral (todos) + grupos"
                emptyMessage={
                  isLoadingGroups
                    ? 'Carregando grupos...'
                    : 'Nenhum grupo cadastrado nas configurações.'
                }
                options={groups.map((group) => ({ id: group.name, label: group.name }))}
                selected={selectedGroups || []}
                onChange={(next) =>
                  setValue('target_groups', next as PostFormValues['target_groups'])
                }
              />
              <p className="text-[11px] font-medium text-slate-400">
                Nenhum grupo selecionado = aviso Geral (visível a todos).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-event-date" className="font-bold">
                Data do Evento (Opcional)
              </Label>
              <Input
                id="post-event-date"
                type="date"
                {...register('event_date')}
                min={dayjs().format('YYYY-MM-DD')}
                className="rounded-xl border-slate-200 dark:border-slate-800"
              />
              <p className="text-[11px] font-medium text-slate-400">
                Se preenchida, o aviso sai do mural automaticamente depois dessa data.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content" className="font-bold">
                Descrição
              </Label>
              <Textarea
                id="post-content"
                {...register('content')}
                placeholder="Descreva os detalhes do aviso aqui..."
                aria-invalid={!!errors.content}
                className="min-h-[100px] rounded-xl border-slate-200 focus:ring-amber-500 dark:border-slate-800"
              />
              {errors.content && (
                <p className="text-xs font-medium text-red-500">{errors.content.message}</p>
              )}
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Banner do Aviso (Opcional)
              </Label>
              <div
                onClick={() => !previewImage && fileInputRef.current?.click()}
                className={
                  previewImage
                    ? 'relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900/50'
                    : 'group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-amber-500/50 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-amber-500/30 dark:hover:bg-amber-900/10'
                }
              >
                {previewImage ? (
                  <>
                    <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage()
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
                      {BANNER_IMAGE.label} · recorte na próxima etapa
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 w-full sm:w-auto rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <HebromSpinner size="sm" className="brightness-200" />
                  Publicando...
                </div>
              ) : (
                'Publicar Aviso'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11 w-full sm:w-auto rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </form>

        {imageToCrop && (
          <ImageCropper
            key={imageToCrop}
            image={imageToCrop}
            open={!!imageToCrop}
            onOpenChange={(open) => !open && setImageToCrop(null)}
            onCropComplete={handleCropComplete}
            spec={BANNER_IMAGE}
            title="Recortar Banner do Aviso"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

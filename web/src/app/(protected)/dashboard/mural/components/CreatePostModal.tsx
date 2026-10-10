'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image as ImageIcon, Send, Type, AlignLeft, Users, CalendarDays } from 'lucide-react'
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Criar Novo Aviso</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Image Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                    previewImage
                      ? 'border-amber-500'
                      : 'border-slate-200 hover:border-amber-400 dark:border-slate-700'
                  }`}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-xs font-medium">
                        Adicionar Banner ou Imagem (Opcional)
                      </span>
                      <span className="text-[10px] uppercase tracking-wider opacity-70">
                        {BANNER_IMAGE.label} · recorte na próxima etapa
                      </span>
                    </div>
                  )}
                  {previewImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      <span className="text-xs font-bold text-white uppercase tracking-widest">
                        Alterar Imagem
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold">
                  <Type className="h-4 w-4 text-amber-500" />
                  Título do Aviso
                </Label>
                <Input
                  {...register('title')}
                  placeholder="Ex: Culto Especial de Santa Ceia"
                  aria-invalid={!!errors.title}
                  className="h-11 rounded-xl"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>
                )}
              </div>

              {/* Alcance */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold">
                  <Users className="h-4 w-4 text-amber-500" />
                  Alcance (Grupos)
                </Label>
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
                <p className="text-[10px] text-slate-500">
                  Nenhum grupo selecionado = aviso Geral (visível a todos).
                </p>
              </div>

              {/* Data do evento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold">
                  <CalendarDays className="h-4 w-4 text-amber-500" />
                  Data do Evento (Opcional)
                </Label>
                <Input
                  type="date"
                  {...register('event_date')}
                  min={dayjs().format('YYYY-MM-DD')}
                  className="h-11 rounded-xl"
                />
                <p className="text-[10px] text-slate-500">
                  Se preenchida, o aviso sai do mural automaticamente depois dessa data.
                </p>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold">
                  <AlignLeft className="h-4 w-4 text-amber-500" />
                  Descrição do Post
                </Label>
                <Textarea
                  {...register('content')}
                  rows={4}
                  placeholder="Descreva os detalhes do aviso aqui..."
                  aria-invalid={!!errors.content}
                  className="resize-none rounded-xl p-4"
                />
                {errors.content && (
                  <p className="text-xs text-red-500 font-medium">{errors.content.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 hover:shadow-amber-500/40 disabled:opacity-50"
                >
                  {isSaving ? (
                    <HebromSpinner size="sm" className="brightness-200" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publicar Aviso
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

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
        </div>
      )}
    </AnimatePresence>
  )
}

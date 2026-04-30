'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Image as ImageIcon,
  Send,
  Type,
  AlignLeft,
  Users,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/useAuth'
import { createPost } from '@/services/firebase/mural'
import { getGroups } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'
import { HebromSpinner } from '@/components/ui/HebromSpinner'

const postSchema = z
  .object({
    title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres'),
    content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
    type: z.enum(['Geral', 'Grupo']),
    target_group: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.type === 'Grupo' && !data.target_group) {
        return false
      }
      return true
    },
    {
      message: 'Selecione um grupo para este aviso',
      path: ['target_group'],
    },
  )

type PostFormValues = z.infer<typeof postSchema>

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const { currentUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [groups, setGroups] = useState<ChurchGroup[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: 'Geral',
      target_group: '',
    },
  })

  const postType = watch('type')

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
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
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
          target_groups: data.type === 'Grupo' && data.target_group ? [data.target_group] : [],
        },
        selectedFile || undefined,
      )

      toast.success('Aviso publicado com sucesso!')
      reset()
      setPreviewImage(null)
      setSelectedFile(null)
      onSuccess()
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
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Type className="h-4 w-4 text-amber-500" />
                  Título do Aviso
                </label>
                <input
                  {...register('title')}
                  placeholder="Ex: Culto Especial de Santa Ceia"
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-amber-500/20 focus:outline-none dark:bg-slate-800 ${
                    errors.title ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>
                )}
              </div>

              {/* Type & Group Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Tipo de Alcance
                  </label>
                  <select
                    {...register('type')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Geral">🌍 Geral (Todos)</option>
                    <option value="Grupo">👥 Grupo Específico</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Users
                      className={`h-4 w-4 ${postType === 'Grupo' ? 'text-amber-500' : 'text-slate-400'}`}
                    />
                    Vínculo de Grupo
                  </label>
                  <select
                    {...register('target_group')}
                    disabled={postType === 'Geral' || isLoadingGroups}
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm transition-all focus:outline-none dark:bg-slate-800 ${
                      postType === 'Geral'
                        ? 'opacity-50 grayscale'
                        : 'border-slate-200 dark:border-slate-700'
                    } ${errors.target_group ? 'border-red-500' : ''}`}
                  >
                    <option value="">Selecione um grupo...</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.name}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {postType === 'Grupo' && groups.length === 0 && !isLoadingGroups && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      Nenhum grupo cadastrado nas configurações.
                    </p>
                  )}
                  {errors.target_group && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.target_group.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-amber-500" />
                  Descrição do Post
                </label>
                <textarea
                  {...register('content')}
                  rows={4}
                  placeholder="Descreva os detalhes do aviso aqui..."
                  className={`w-full resize-none rounded-xl border bg-slate-50 p-4 text-sm transition-all focus:ring-2 focus:ring-amber-500/20 focus:outline-none dark:bg-slate-800 ${
                    errors.content ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
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
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-white"
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
        </div>
      )}
    </AnimatePresence>
  )
}

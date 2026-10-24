'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/store/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import {
  User,
  Mail,
  Shield,
  CreditCard,
  Save,
  Camera,
  CheckCircle2,
  Info,
  ClipboardList,
  Pencil,
} from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updateUserProfile } from '@/services/firebase/users'
import { useFirebaseStorage } from '@/services/firebase/storage'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { PageTitle } from '@/components/ui/page-title'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getRoleLabel } from '@/lib/member-options'
import { MyChildrenSection } from './components/MyChildrenSection'
import { MyDataModal } from './components/MyDataModal'

const profileSchema = z.object({
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  bio: z.string().max(160, 'A bio deve ter no máximo 160 caracteres').optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { currentUser, refreshCurrentUser } = useAuth()
  const { permissions, role: userRole } = usePermissions()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [newImageURL, setNewImageURL] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [isMyDataOpen, setIsMyDataOpen] = useState(false)

  const {
    loading: isUploading,
    url: uploadUrl,
    error: uploadError,
    setStorage,
  } = useFirebaseStorage()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      bio: '',
    },
  })

  useEffect(() => {
    if (currentUser) {
      reset({
        full_name: currentUser.profile.full_name || '',
        bio: currentUser.profile.bio || '',
      })
    }
  }, [currentUser, reset])

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUser) return

    setIsSaving(true)
    try {
      await updateUserProfile(currentUser.uid, data)
      await refreshCurrentUser()
      toast.success('Perfil atualizado com sucesso!', {
        description: 'Suas informações foram salvas em nossa base de dados.',
      })
    } catch (error) {
      toast.error('Erro ao salvar alterações.', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    if (!file.type.startsWith('image/')) {
      toast.error('Formato inválido', { description: 'Por favor, selecione uma imagem.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    setOriginalFileName(file.name)
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string)
      setIsCropperOpen(true)
    })
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!currentUser) return

    setStorage({
      fileBlob: croppedBlob,
      fileCategory: 'avatar',
      fileName: `avatar_${Date.now()}.${originalFileName.split('.').pop() || 'jpg'}`,
      userId: currentUser.uid,
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle successful upload
  // O refreshCurrentUser troca o currentUser e reexecuta este efeito: a ref garante que
  // cada URL enviada seja gravada uma vez só.
  const savedUploadUrlRef = useRef<string | null>(null)
  useEffect(() => {
    const updateAvatar = async () => {
      if (uploadUrl && currentUser && savedUploadUrlRef.current !== uploadUrl) {
        savedUploadUrlRef.current = uploadUrl
        try {
          await updateUserProfile(currentUser.uid, { avatar_url: uploadUrl })
          await refreshCurrentUser()
          setNewImageURL(uploadUrl)
          toast.success('Foto de perfil atualizada!')
        } catch (error) {
          toast.error('Erro ao salvar URL da foto no perfil')
        }
      }
    }

    updateAvatar()
  }, [uploadUrl, currentUser, refreshCurrentUser])

  // Handle upload errors
  useEffect(() => {
    if (uploadError) {
      toast.error('Erro no upload', { description: uploadError })
    }
  }, [uploadError])

  if (!currentUser) return null

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-2">
        <PageTitle
          title="Meu Perfil"
          description="Gerencie suas informações pessoais e configurações de conta."
        />
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="relative group mx-auto md:mx-0">
                    <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-slate-100 dark:border-slate-800 relative">
                      <UserAvatar
                        src={newImageURL || currentUser.profile.avatar_url}
                        name={currentUser.profile.full_name}
                        className="h-full w-full rounded-2xl"
                        textClassName="text-4xl"
                      />
                      <AnimatePresence>
                        {isUploading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                          >
                            <HebromSpinner size="md" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                      {currentUser.profile.full_name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {currentUser.email}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 md:justify-start">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {getRoleLabel(userRole)}
                      </span>
                      {currentUser.profile.baptism_date && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Batizado em {currentUser.profile.baptism_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...register('full_name')}
                        className="h-11 rounded-xl pl-10"
                        aria-invalid={!!errors.full_name}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-xs text-red-500">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      E-mail (Inalterável)
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>
                      Bio / Sobre você
                    </Label>
                    <Textarea
                      {...register('bio')}
                      rows={3}
                      className="rounded-xl p-4"
                      aria-invalid={!!errors.bio}
                      placeholder="Conte um pouco sobre sua trajetória ou ministério..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.bio ? (
                        <p className="text-xs text-red-500">{errors.bio.message}</p>
                      ) : (
                        <div />
                      )}
                      <p className="text-right text-[10px] text-slate-400">Máximo 160 caracteres</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 hover:shadow-amber-500/40 active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <HebromSpinner size="sm" className="brightness-200" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Perfil
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                  Ficha Cadastral
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Família, endereço completo, documentos e saúde — os mesmos dados que a
                  secretaria mantém sobre você.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMyDataOpen(true)}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
              >
                <Pencil className="h-4 w-4" />
                Editar meus dados
              </button>
            </div>
          </div>

          {/* Ministerial Data (Read Only for Members, Edit by Admin in future) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-6 flex items-center gap-2 text-base md:text-lg font-bold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-amber-500" />
              Dados Ministeriais
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nível de Acesso
                </span>
                <span className="font-semibold text-slate-900 dark:text-white uppercase">
                  {userRole === 'visitor' && 'Visitante'}
                  {userRole === 'member' && 'Membro'}
                  {userRole === 'secretary' && 'Secretária'}
                  {userRole === 'pastor' && 'Pastor'}
                  {userRole === 'pending_member' && 'Pendente'}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Data de Batismo
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {currentUser.profile.baptism_date || 'Não informado'}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Grupos Participantes
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentUser.sub_groups.length > 0 ? (
                    currentUser.sub_groups.map((group) => (
                      <span
                        key={group}
                        className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        {group}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Nenhum grupo</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  ID do Usuário
                </span>
                <span className="font-mono text-[10px] text-slate-500 truncate">
                  {currentUser.uid}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/10">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-500/80">
                  Dados ministeriais só podem ser alterados pela secretaria ou por um pastor. Caso
                  haja alguma inconsistência, entre em contato.
                </p>
              </div>
            </div>
          </div>

          <MyChildrenSection />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-indigo-700 p-6 text-white">
            <h4 className="font-bold">Dica de Perfil</h4>
            <p className="mt-2 text-sm text-amber-100">
              Mantenha seu telefone e endereço atualizados para receber comunicações da secretaria e
              comunicados oficiais.
            </p>
          </div>
        </div>
      </div>

      <MyDataModal open={isMyDataOpen} onOpenChange={setIsMyDataOpen} />

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          open={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}

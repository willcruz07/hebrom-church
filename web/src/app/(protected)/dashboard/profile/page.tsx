'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/store/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  Save,
  Camera,
  MapPin,
  Loader2,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updateUserProfile, uploadAvatar } from '@/services/firebase/users'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const profileSchema = z.object({
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  bio: z.string().max(160, 'A bio deve ter no máximo 160 caracteres').optional().or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val.replace(/\D/g, '').length >= 10,
      'Telefone inválido (mínimo 10 dígitos)',
    ),
  address: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.length >= 5, 'Endereço muito curto'),
  birth_date: z.string().optional().or(z.literal('')),
  baptism_date: z.string().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { currentUser, checkAuth } = useAuth()
  const { permissions, role: userRole } = usePermissions()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      phone: '',
      address: '',
      birth_date: '',
      baptism_date: '',
    },
  })

  // Sync form with user data
  useEffect(() => {
    if (currentUser) {
      reset({
        full_name: currentUser.profile.full_name || '',
        bio: currentUser.profile.bio || '',
        phone: currentUser.profile.phone || '',
        address: currentUser.profile.address || '',
        birth_date: currentUser.profile.birth_date || '',
        baptism_date: currentUser.profile.baptism_date || '',
      })
    }
  }, [currentUser, reset])

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUser) return

    setIsSaving(true)
    try {
      await updateUserProfile(currentUser.uid, data)
      await checkAuth() // Refresh Zustand state
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

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'A imagem deve ter no máximo 2MB.' })
      return
    }

    setIsUploading(true)
    try {
      const downloadURL = await uploadAvatar(currentUser.uid, file)
      await updateUserProfile(currentUser.uid, { avatar_url: downloadURL })
      await checkAuth()
      toast.success('Foto atualizada!')
    } catch (error) {
      toast.error('Erro no upload')
    } finally {
      setIsUploading(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
          Meu Perfil
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Gerencie suas informações pessoais e configurações de conta.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Info Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  {/* Avatar Upload */}
                  <div className="relative group mx-auto md:mx-0">
                    <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-slate-100 dark:border-slate-800 relative">
                      <img
                        src={
                          currentUser.profile.avatar_url ||
                          `https://ui-avatars.com/api/?name=${currentUser.profile.full_name}&background=0D8ABC&color=fff&size=256`
                        }
                        alt="Avatar"
                        className="object-cover w-full"
                      />
                      <AnimatePresence>
                        {isUploading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                          >
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
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
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentUser.profile.full_name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {currentUser.email}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 md:justify-start">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {userRole === 'visitor'
                          ? 'Visitante'
                          : userRole === 'member'
                            ? 'Membro'
                            : userRole === 'pastor'
                              ? 'Pastor'
                              : 'Secretaria'}
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        {...register('full_name')}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-amber-500 focus:outline-none dark:bg-slate-800 ${errors.full_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-xs text-red-500">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      E-mail (Inalterável)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm opacity-60 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Telefone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        {...register('phone')}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-amber-500 focus:outline-none dark:bg-slate-800 ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Data de Nascimento
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        {...register('birth_date')}
                        type="date"
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-amber-500 focus:outline-none dark:bg-slate-800 ${errors.birth_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                      />
                    </div>
                    {errors.birth_date && (
                      <p className="text-xs text-red-500">{errors.birth_date.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Endereço Completo
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        {...register('address')}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-amber-500 focus:outline-none dark:bg-slate-800 ${errors.address ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                      />
                    </div>
                    {errors.address && (
                      <p className="text-xs text-red-500">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Bio / Sobre você
                    </label>
                    <textarea
                      {...register('bio')}
                      rows={3}
                      className={`w-full rounded-xl border bg-slate-50 p-4 text-sm transition-colors focus:border-amber-500 focus:outline-none dark:bg-slate-800 ${errors.bio ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Perfil
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Ministerial Data (Read Only for Members, Edit by Admin in future) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
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
        </div>

        <div className="space-y-6">
          {/* <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <CreditCard className="h-5 w-5 text-amber-500" />
              Sua Carteirinha
            </h3>

            {permissions.canViewProfileCard ? (
              <motion.div
                whileHover={{ y: -5 }}
                className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-amber-950/20"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                        <img src="/logo.png" alt="Logo" className="brightness-200" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight uppercase tracking-widest">
                          Hebrom
                        </h4>
                        <p className="text-[8px] text-amber-400 font-bold uppercase">
                          System Admin
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[8px] font-bold backdrop-blur-sm">
                      ID: {currentUser.uid.slice(0, 8)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/20 bg-white/5 p-0.5">
                        <img
                          src={
                            currentUser.profile.avatar_url ||
                            `https://ui-avatars.com/api/?name=${currentUser.profile.full_name}&background=0D8ABC&color=fff&size=128`
                          }
                          alt="Avatar"
                          width={64}
                          height={64}
                          className="h-full w-full rounded-[10px] object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest opacity-70">
                          Membro
                        </p>
                        <p className="font-bold text-lg leading-tight truncate max-w-[180px]">
                          {currentUser.profile.full_name.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cargo: {userRole.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-white/10 pt-3">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                            Validade
                          </p>
                          <p className="text-[10px] font-bold">12/2026</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                            Igreja
                          </p>
                          <p className="text-[10px] font-bold italic">Sede</p>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded bg-white p-1">
                        <div className="h-full w-full bg-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
                <Shield className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-xs text-slate-500">
                  Sua carteirinha digital será gerada após a aprovação de sua membresia.
                </p>
              </div>
            )}

            <button
              onClick={() => (window.location.href = '/dashboard/id-card')}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              Ver Carteira Completa
            </button>
          </div> */}

          <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-indigo-700 p-6 text-white">
            <h4 className="font-bold">Dica de Perfil</h4>
            <p className="mt-2 text-sm text-amber-100">
              Mantenha seu telefone e endereço atualizados para receber comunicações da secretaria e
              comunicados oficiais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

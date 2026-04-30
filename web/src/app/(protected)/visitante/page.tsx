'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/store/useAuth'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { useState } from 'react'

const memberRequestSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
})

type MemberRequestValues = z.infer<typeof memberRequestSchema>

export default function VisitantePage() {
  const user = useAuth((state) => state.currentUser)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberRequestValues>({
    resolver: zodResolver(memberRequestSchema),
    defaultValues: {
      fullName: user?.profile?.full_name || '',
      phone: '',
    },
  })

  const onSubmit = async (data: MemberRequestValues) => {
    if (!user) return
    setError(null)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        role: 'pending_member',
        'profile.full_name': data.fullName,
        'profile.phone': data.phone,
      })

      // // Update local state
      // updateUser({
      //   role: 'pending_member',
      //   profile: { ...user.profile, full_name: data.fullName, phone: data.phone },
      // })

      router.replace('/pendente')
    } catch (err: unknown) {
      console.error(err)
      setError('Erro ao enviar solicitação. Tente novamente.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-100">Bem-vindo, Visitante!</h1>
        <p className="mt-2 text-slate-400">
          Para acessar todos os recursos do Hebrom Sys, como pedidos de oração e comunicados,
          solicite seu acesso como membro.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-slate-200">Solicitação de Acesso</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Nome Completo</label>
            <input
              {...register('fullName')}
              className="w-full rounded-md border border-slate-700 bg-slate-800 p-2.5 text-slate-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="Digite seu nome completo"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Telefone / WhatsApp
            </label>
            <input
              {...register('phone')}
              className="w-full rounded-md border border-slate-700 bg-slate-800 p-2.5 text-slate-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="(00) 00000-0000"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
          </div>

          {error && (
            <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-md bg-amber-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-70"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Acesso'}
          </button>
        </form>
      </div>
    </div>
  )
}

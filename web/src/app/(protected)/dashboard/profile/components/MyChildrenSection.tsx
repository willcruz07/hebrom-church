'use client'

import { useEffect, useState } from 'react'
import { Baby, Plus } from 'lucide-react'
import { KidCard } from '@/components/kids/KidCard'
import { KidFormModal } from '@/components/kids/KidFormModal'
import { useAuth } from '@/store/useAuth'
import { useMyChildren } from '@/store/useMyChildren'
import type { KidChild } from '@/types'

export function MyChildrenSection() {
  const { currentUser } = useAuth()
  const { children, status, load, refresh } = useMyChildren()
  // A criança fica guardada ao fechar, para o modal não esvaziar durante a animação de saída
  const [modal, setModal] = useState<{ open: boolean; child: KidChild | null }>({ open: false, child: null })

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white md:text-lg">
        <Baby className="h-5 w-5 text-amber-500" />
        Crianças sob minha responsabilidade
      </h3>
      <p className="mb-5 text-sm text-slate-500">
        A equipe Kids usa estas informações para cuidar do seu filho durante o culto.
      </p>

      {status === 'error' && (
        <p className="mb-4 text-sm text-red-500">Não foi possível carregar as crianças agora.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {children.map((child) => (
          <KidCard
            key={child.id}
            child={child}
            subtitle={
              child.is_visitor && child.created_by !== currentUser?.uid
                ? 'Cadastro rápido da equipe Kids — complete o prontuário'
                : undefined
            }
            onClick={() => setModal({ open: true, child })}
          />
        ))}
        <button
          type="button"
          onClick={() => setModal({ open: true, child: null })}
          className="flex min-h-[74px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 transition-colors hover:border-amber-400 hover:text-amber-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-amber-400"
        >
          <Plus className="h-4 w-4" />
          Adicionar criança
        </button>
      </div>

      <KidFormModal
        open={modal.open}
        child={modal.child}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
        onSaved={refresh}
      />
    </div>
  )
}

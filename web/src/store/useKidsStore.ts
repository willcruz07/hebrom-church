import { create } from 'zustand'
import type { Unsubscribe } from 'firebase/firestore'
import { subscribeToChildren } from '@/services/firebase/kids'
import type { KidChild } from '@/types'

interface KidsState {
  children: KidChild[]
  loaded: boolean
  error: boolean
  startListening: () => void
}

let unsubscribe: Unsubscribe | null = null

// Listener único de `kids_children`, vivo durante a sessão (mesmo padrão do useMembersStore):
// voltar para Membros → Kids ou para o Dashboard mostra os dados na hora.
export const useKidsStore = create<KidsState>((set) => ({
  children: [],
  loaded: false,
  error: false,

  startListening() {
    if (unsubscribe) return
    unsubscribe = subscribeToChildren(
      (children) => set({ children, loaded: true, error: false }),
      (error) => {
        console.error('Erro no listener de crianças:', error)
        unsubscribe = null
        set({ loaded: true, error: true })
      },
    )
  },
}))

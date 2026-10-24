import { create } from 'zustand'
import type { Unsubscribe } from 'firebase/firestore'
import { subscribeToOpenSession } from '@/services/firebase/kids-room'
import type { KidSession } from '@/types'

interface KidsSessionState {
  session: KidSession | null
  loaded: boolean
  error: boolean
  startListening: () => void
}

let unsubscribe: Unsubscribe | null = null

// Listener único da sessão aberta, vivo durante a sessão do app (1 leitura por mudança).
export const useKidsSession = create<KidsSessionState>((set) => ({
  session: null,
  loaded: false,
  error: false,

  startListening() {
    if (unsubscribe) return
    unsubscribe = subscribeToOpenSession(
      (session) => set({ session, loaded: true, error: false }),
      (error) => {
        console.error('Erro no listener da Área Kids:', error)
        unsubscribe = null
        set({ loaded: true, error: true })
      },
    )
  },
}))

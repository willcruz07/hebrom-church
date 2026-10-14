import { create } from 'zustand'

interface BottomNavState {
  /** Telas de leitura escondem a barra inferior enquanto o usuário lê. */
  hidden: boolean
  setHidden: (hidden: boolean) => void
}

export const useBottomNav = create<BottomNavState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}))

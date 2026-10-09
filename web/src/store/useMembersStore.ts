import { create } from 'zustand'
import { Unsubscribe } from 'firebase/firestore'
import { AppUser } from '@/types'
import { subscribeToUsers } from '@/services/firebase/users'

interface MembersState {
  members: AppUser[]
  loaded: boolean
  error: boolean
  startListening: () => void
  getMember: (uid: string) => AppUser | undefined
}

let unsubscribe: Unsubscribe | null = null

// Listener único da coleção `users`, vivo durante a sessão (não por montagem de página):
// voltar para /dashboard/members mostra a lista na hora e o detalhe do membro abre com o
// dado que já veio daqui. O signOut faz navegação completa, o que derruba o listener.
// Ver specs/navegacao-fluida.md e specs/firestore-arquitetura-dados.md.
export const useMembersStore = create<MembersState>((set, get) => ({
  members: [],
  loaded: false,
  error: false,

  startListening() {
    if (unsubscribe) return

    unsubscribe = subscribeToUsers(
      (members) => set({ members, loaded: true, error: false }),
      (error) => {
        console.error('Erro no listener de membros:', error)
        unsubscribe = null
        set({ loaded: true, error: true })
      },
    )
  },

  getMember(uid) {
    return get().members.find((m) => m.uid === uid)
  },
}))

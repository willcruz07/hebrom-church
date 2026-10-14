import { create } from 'zustand'
import { getMyChildren } from '@/services/firebase/kids'
import type { KidChild } from '@/types'

interface MyChildrenState {
  uid: string | null
  children: KidChild[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Carrega uma vez por usuário; chamadas repetidas não releem o Firestore. */
  load: (uid: string) => Promise<void>
  /** Relê depois de criar, editar ou remover uma criança. */
  refresh: () => Promise<void>
}

export const useMyChildren = create<MyChildrenState>((set, get) => {
  async function fetchFor(uid: string) {
    try {
      const children = await getMyChildren(uid)
      if (get().uid === uid) set({ children, status: 'ready' })
    } catch (error) {
      console.error(error)
      if (get().uid === uid) set({ status: 'error' })
    }
  }

  return {
    uid: null,
    children: [],
    status: 'idle',

    load: async (uid) => {
      const { uid: current, status } = get()
      if (current === uid && (status === 'loading' || status === 'ready')) return
      set({ uid, children: [], status: 'loading' })
      await fetchFor(uid)
    },

    refresh: async () => {
      const { uid } = get()
      if (uid) await fetchFor(uid)
    },
  }
})

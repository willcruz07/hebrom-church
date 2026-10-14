import { create } from 'zustand'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'
import { addBookmark, getBookmarks, removeBookmark } from '@/services/firebase/bible'
import type { BibleBookmark } from '@/types'

interface BibleBookmarksState {
  uid: string | null
  items: BibleBookmark[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Carrega uma vez por usuário; chamadas repetidas não releem o Firestore. */
  load: (uid: string) => Promise<void>
  /** Marca/desmarca com atualização otimista; desfaz se a gravação falhar. */
  toggle: (uid: string, ref: string) => Promise<void>
}

export const useBibleBookmarks = create<BibleBookmarksState>((set, get) => ({
  uid: null,
  items: [],
  status: 'idle',

  load: async (uid) => {
    const { uid: current, status } = get()
    if (current === uid && (status === 'loading' || status === 'ready')) return

    set({ uid, items: [], status: 'loading' })
    try {
      const items = await getBookmarks(uid)
      if (get().uid === uid) set({ items, status: 'ready' })
    } catch (error) {
      console.error(error)
      if (get().uid === uid) set({ status: 'error' })
    }
  },

  toggle: async (uid, ref) => {
    const previous = get().items
    const exists = previous.some((i) => i.ref === ref)
    set({
      items: exists ? previous.filter((i) => i.ref !== ref) : [...previous, { ref, created_at: Timestamp.now() }],
    })

    try {
      const items = await (exists ? removeBookmark : addBookmark)(uid, ref)
      if (get().uid === uid) set({ items, status: 'ready' })
      toast.success(exists ? 'Marcador removido' : 'Marcador adicionado')
    } catch (error) {
      console.error(error)
      set({ items: previous })
      toast.error('Não foi possível salvar o marcador. Verifique sua conexão.')
    }
  },
}))

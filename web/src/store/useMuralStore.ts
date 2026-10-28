import { create } from 'zustand'
import type { QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore'
import { ChurchGroup, FeedPost } from '@/types'
import {
  MURAL_PAGE_SIZE,
  getLatestPosts,
  getPostsBefore,
  subscribeToPostsSince,
} from '@/services/firebase/mural'
import { getGroups } from '@/services/firebase/groups'
import { isLastPage, updateFeedPost } from '@/lib/mural/feed'

type MuralStatus = 'idle' | 'loading' | 'ready' | 'error'

interface MuralState {
  /** Posts desde a âncora, em tempo real. */
  live: FeedPost[]
  /** Páginas antigas já carregadas pela rolagem (sem tempo real). */
  older: FeedPost[]
  status: MuralStatus
  hasMore: boolean
  loadingMore: boolean
  loadMoreFailed: boolean
  /** Todos os grupos (o filtro por `sub_groups` do usuário é feito na página). */
  groups: ChurchGroup[]
  start: () => void
  loadMore: () => Promise<void>
  updatePost: (id: string, update: (post: FeedPost) => FeedPost) => void
  removePost: (id: string) => void
}

let unsubscribe: Unsubscribe | null = null
let cursor: QueryDocumentSnapshot | null = null
let groupsRequested = false

// Listener único do mural, vivo durante a sessão (não por montagem de página): voltar ao
// mural mostra a lista na hora. Só a primeira página fica em tempo real; o histórico vem
// por paginação. O signOut faz navegação completa, o que derruba o listener.
// Ver specs/firestore-arquitetura-dados.md.
export const useMuralStore = create<MuralState>((set, get) => ({
  live: [],
  older: [],
  status: 'idle',
  hasMore: false,
  loadingMore: false,
  loadMoreFailed: false,
  groups: [],

  start() {
    if (!groupsRequested) {
      groupsRequested = true
      getGroups().then((groups) => set({ groups }))
    }

    const { status } = get()
    if (status === 'loading' || status === 'ready') return
    // Nova tentativa depois de erro: descarta o listener anterior, se ainda existir
    unsubscribe?.()
    unsubscribe = null
    set({ status: 'loading' })

    getLatestPosts()
      .then((page) => {
        const hasMore = !isLastPage(page.posts.length, MURAL_PAGE_SIZE)
        cursor = page.cursor
        // Mostra a primeira página já; o listener assume a partir da âncora
        set({ live: page.posts, older: [], hasMore, status: 'ready', loadMoreFailed: false })

        const anchor = hasMore ? (page.posts.at(-1)?.created_at ?? null) : null
        unsubscribe = subscribeToPostsSince(
          anchor,
          (live) => set({ live }),
          (error) => {
            console.error('Erro no listener do mural:', error)
            set({ status: 'error' })
          },
        )
      })
      .catch((error) => {
        console.error('Erro ao carregar o mural:', error)
        set({ status: 'error' })
      })
  },

  async loadMore() {
    const { hasMore, loadingMore, status } = get()
    if (!hasMore || loadingMore || status !== 'ready' || !cursor) return

    set({ loadingMore: true, loadMoreFailed: false })
    try {
      const page = await getPostsBefore(cursor)
      cursor = page.cursor ?? cursor
      set((s) => ({
        older: [...s.older, ...page.posts],
        hasMore: !isLastPage(page.posts.length, MURAL_PAGE_SIZE),
      }))
    } catch (error) {
      console.error('Erro ao carregar mais avisos:', error)
      set({ loadMoreFailed: true })
    } finally {
      set({ loadingMore: false })
    }
  },

  // Atualização local imediata — necessária nas páginas antigas, que não têm listener.
  // Nos posts ao vivo o próximo snapshot traz o mesmo valor.
  updatePost(id, update) {
    set((s) => ({
      live: updateFeedPost(s.live, id, update),
      older: updateFeedPost(s.older, id, update),
    }))
  },

  removePost(id) {
    set((s) => ({
      live: s.live.filter((p) => p.id !== id),
      older: s.older.filter((p) => p.id !== id),
    }))
  },
}))

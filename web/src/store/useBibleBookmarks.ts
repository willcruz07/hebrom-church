import { create } from 'zustand'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'
import {
  mergeSelection,
  newBookmarkId,
  setNote,
  withoutBookmark,
  type BookmarkResult,
  type BookmarkRuleError,
  type VerseSelection,
} from '@/lib/bible/bookmarks'
import {
  BookmarkRuleViolation,
  getBookmarks,
  removeBookmark,
  saveSelection as saveSelectionRemote,
  updateNote as updateNoteRemote,
} from '@/services/firebase/bible'
import type { BibleBookmark } from '@/types'

const RULE_MESSAGES: Record<BookmarkRuleError, string> = {
  limit: 'Limite de 200 marcadores atingido. Remova algum para continuar.',
  'note-too-long': 'A nota unida passaria de 2.000 caracteres. Encurte a anotação antes de unir.',
}

interface BibleBookmarksState {
  uid: string | null
  items: BibleBookmark[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Carrega uma vez por usuário; chamadas repetidas não releem o Firestore. */
  load: (uid: string) => Promise<void>
  /** Marca a seleção (cria ou funde), com nota opcional. `true` = gravou. */
  saveSelection: (uid: string, sel: VerseSelection, note?: string) => Promise<boolean>
  updateNote: (uid: string, id: string, note: string) => Promise<boolean>
  remove: (uid: string, id: string) => Promise<boolean>
}

export const useBibleBookmarks = create<BibleBookmarksState>((set, get) => {
  /** Aplica na hora (otimista); desfaz e avisa se a gravação falhar. */
  async function commit(
    uid: string,
    local: BookmarkResult<Timestamp>,
    remote: () => Promise<BibleBookmark[]>,
    successMessage: string,
  ): Promise<boolean> {
    if (!local.ok) {
      toast.error(RULE_MESSAGES[local.error])
      return false
    }
    const previous = get().items
    set({ items: local.items })
    try {
      const items = await remote()
      if (get().uid === uid) set({ items, status: 'ready' })
      toast.success(successMessage)
      return true
    } catch (error) {
      console.error(error)
      set({ items: previous })
      toast.error(
        error instanceof BookmarkRuleViolation
          ? RULE_MESSAGES[error.rule]
          : 'Não foi possível salvar. Verifique sua conexão.',
      )
      return false
    }
  }

  return {
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

    saveSelection: (uid, sel, note) => {
      const newId = newBookmarkId()
      return commit(
        uid,
        mergeSelection(get().items, sel, { now: Timestamp.now(), newId, note }),
        () => saveSelectionRemote(uid, sel, { newId, note }),
        note?.trim() ? 'Marcador e anotação salvos' : 'Marcador adicionado',
      )
    },

    updateNote: (uid, id, note) =>
      commit(uid, setNote(get().items, id, note, Timestamp.now()), () => updateNoteRemote(uid, id, note), 'Anotação salva'),

    remove: (uid, id) =>
      commit(uid, { ok: true, items: withoutBookmark(get().items, id) }, () => removeBookmark(uid, id), 'Marcador removido'),
  }
})

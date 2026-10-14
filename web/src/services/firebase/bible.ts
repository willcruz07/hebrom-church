import { doc, getDoc, runTransaction, serverTimestamp, Timestamp, type DocumentData } from 'firebase/firestore'
import { db } from './config'
import type { BibleBookmark } from '@/types'

// Um documento por usuário (fora de `users`, para não pesar nas listas de membros):
// carregar todos os marcadores custa 1 leitura.
const BIBLE_BOOKMARKS_COLLECTION = 'bible_bookmarks'
export const MAX_BIBLE_BOOKMARKS = 200

const bookmarksDoc = (uid: string) => doc(db, BIBLE_BOOKMARKS_COLLECTION, uid)

const readItems = (data: DocumentData | undefined): BibleBookmark[] =>
  Array.isArray(data?.items) ? (data.items as BibleBookmark[]) : []

export async function getBookmarks(uid: string): Promise<BibleBookmark[]> {
  return readItems((await getDoc(bookmarksDoc(uid))).data())
}

function updateBookmarks(uid: string, change: (items: BibleBookmark[]) => BibleBookmark[]) {
  return runTransaction(db, async (tx) => {
    const snapshot = await tx.get(bookmarksDoc(uid))
    const items = change(readItems(snapshot.data()))
    tx.set(bookmarksDoc(uid), { items, updated_at: serverTimestamp() })
    return items
  })
}

/** Adiciona o marcador (sem duplicar); passando de 200, o mais antigo sai. */
export const addBookmark = (uid: string, ref: string) =>
  updateBookmarks(uid, (items) =>
    items.some((i) => i.ref === ref)
      ? items
      : [...items, { ref, created_at: Timestamp.now() }]
          .sort((a, b) => a.created_at.toMillis() - b.created_at.toMillis())
          .slice(-MAX_BIBLE_BOOKMARKS),
  )

export const removeBookmark = (uid: string, ref: string) =>
  updateBookmarks(uid, (items) => items.filter((i) => i.ref !== ref))

import { doc, getDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './config'
import {
  mergeSelection,
  normalizeBookmarks,
  setNote,
  withoutBookmark,
  type BookmarkResult,
  type BookmarkRuleError,
  type VerseSelection,
} from '@/lib/bible/bookmarks'
import type { BibleBookmark } from '@/types'

// Um documento por usuário (fora de `users`, para não pesar nas listas de membros):
// carregar todos os marcadores, com as notas, custa 1 leitura. Privado: só o dono lê/grava.
const BIBLE_BOOKMARKS_COLLECTION = 'bible_bookmarks'

const bookmarksDoc = (uid: string) => doc(db, BIBLE_BOOKMARKS_COLLECTION, uid)

/** Regra violada no servidor (ex.: o limite foi atingido em outro aparelho). */
export class BookmarkRuleViolation extends Error {
  readonly rule: BookmarkRuleError
  constructor(rule: BookmarkRuleError) {
    super(rule)
    this.rule = rule
  }
}

export async function getBookmarks(uid: string): Promise<BibleBookmark[]> {
  return normalizeBookmarks<Timestamp>((await getDoc(bookmarksDoc(uid))).data()?.items)
}

function updateBookmarks(uid: string, change: (items: BibleBookmark[]) => BibleBookmark[]) {
  return runTransaction(db, async (tx) => {
    const snapshot = await tx.get(bookmarksDoc(uid))
    const items = change(normalizeBookmarks<Timestamp>(snapshot.data()?.items))
    tx.set(bookmarksDoc(uid), { items, updated_at: serverTimestamp() })
    return items
  })
}

const unwrap = (result: BookmarkResult<Timestamp>) => {
  if (!result.ok) throw new BookmarkRuleViolation(result.error)
  return result.items
}

export const saveSelection = (uid: string, sel: VerseSelection, options: { newId: string; note?: string }) =>
  updateBookmarks(uid, (items) => unwrap(mergeSelection(items, sel, { ...options, now: Timestamp.now() })))

export const updateNote = (uid: string, id: string, note: string) =>
  updateBookmarks(uid, (items) => unwrap(setNote(items, id, note, Timestamp.now())))

export const removeBookmark = (uid: string, id: string) =>
  updateBookmarks(uid, (items) => withoutBookmark(items, id))

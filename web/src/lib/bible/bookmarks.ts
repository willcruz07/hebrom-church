import { findBookById, isValidVerse, parseRefKey } from './catalog.ts'
import type { BibleBookmark, TimestampLike } from './types.ts'

export const MAX_BIBLE_BOOKMARKS = 200
export const MAX_BOOKMARK_NOTE_LENGTH = 2000
/** Maior trecho aceito num `?v=` (o maior capítulo da Bíblia tem 176 versículos). */
const MAX_VERSE_RANGE = 200

export interface VerseSelection {
  bookId: string
  chapter: number
  verses: number[]
}

export const sortedUnique = (verses: number[]) => [...new Set(verses)].sort((a, b) => a - b)

/** Nota aparada; vazia ou só espaços vira "sem nota". */
export function cleanNote(note: string | undefined): string | undefined {
  const trimmed = note?.trim()
  return trimmed ? trimmed : undefined
}

/** Monta o marcador sem chaves `undefined` (o Firestore recusa `undefined`). */
export function buildBookmark<T extends TimestampLike>(fields: {
  id: string
  bookId: string
  chapter: number
  verses: number[]
  note?: string
  created_at: T
  updated_at?: T
}): BibleBookmark<T> {
  const { note, updated_at, ...rest } = fields
  return {
    ...rest,
    ...(note ? { note } : {}),
    ...(updated_at ? { updated_at } : {}),
  }
}

/** [1, 2, 3, 7] → "1-3, 7" */
export function formatVerses(verses: number[]): string {
  const sorted = sortedUnique(verses)
  if (!sorted.length) return ''
  const parts: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (const verse of sorted.slice(1)) {
    if (verse === prev + 1) {
      prev = verse
      continue
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = verse
    prev = verse
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`)
  return parts.join(', ')
}

/** "Levítico 27:1-3, 7" */
export function formatBookmarkRef(sel: VerseSelection): string {
  const name = findBookById(sel.bookId)?.name ?? sel.bookId
  return `${name} ${sel.chapter}:${formatVerses(sel.verses)}`
}

/** "1-3,7" → [1, 2, 3, 7]. Qualquer parte inválida invalida tudo (devolve []). */
export function parseVerseParam(param: string | undefined): number[] {
  if (!param) return []
  const verses: number[] = []
  for (const part of param.split(',')) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim())
    if (!match) return []
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : start
    if (start < 1 || end < start || end - start > MAX_VERSE_RANGE) return []
    for (let v = start; v <= end; v++) verses.push(v)
  }
  return sortedUnique(verses)
}

const isTimestamp = (value: unknown): value is TimestampLike =>
  !!value && typeof (value as TimestampLike).toMillis === 'function'

/** Lê `items` do Firestore: converte o formato antigo `{ ref }` e descarta o que for inválido. */
export function normalizeBookmarks<T extends TimestampLike>(raw: unknown): BibleBookmark<T>[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): BibleBookmark<T>[] => {
    if (!item || typeof item !== 'object') return []
    const r = item as Record<string, unknown>
    if (!isTimestamp(r.created_at)) return []
    const created_at = r.created_at as T

    // Formato antigo: um versículo por item, endereço "LEV.27.1"
    if (typeof r.ref === 'string') {
      const ref = parseRefKey(r.ref)
      if (!ref) return []
      return [buildBookmark({ id: r.ref, bookId: ref.bookId, chapter: ref.chapter, verses: [ref.verse], created_at })]
    }

    const book = typeof r.bookId === 'string' ? findBookById(r.bookId) : null
    const chapter = typeof r.chapter === 'number' ? r.chapter : NaN
    if (!book || typeof r.id !== 'string' || !Array.isArray(r.verses)) return []
    const verses = sortedUnique(
      r.verses.filter((v): v is number => typeof v === 'number' && isValidVerse(book, chapter, v)),
    )
    if (!verses.length) return []

    return [
      buildBookmark({
        id: r.id,
        bookId: book.id,
        chapter,
        verses,
        note: typeof r.note === 'string' ? cleanNote(r.note) : undefined,
        created_at,
        updated_at: isTimestamp(r.updated_at) ? (r.updated_at as T) : undefined,
      }),
    ]
  })
}

export function findBookmarkForVerse<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  bookId: string,
  chapter: number,
  verse: number,
): BibleBookmark<T> | null {
  return items.find((b) => b.bookId === bookId && b.chapter === chapter && b.verses.includes(verse)) ?? null
}

export type BookmarkRuleError = 'limit' | 'note-too-long'

export type BookmarkResult<T extends TimestampLike> =
  | { ok: true; items: BibleBookmark<T>[] }
  | { ok: false; error: BookmarkRuleError }

/** Marcadores do mesmo capítulo com pelo menos um versículo da seleção. */
export function overlappingBookmarks<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  sel: VerseSelection,
): BibleBookmark<T>[] {
  return items.filter(
    (b) => b.bookId === sel.bookId && b.chapter === sel.chapter && b.verses.some((v) => sel.verses.includes(v)),
  )
}

/**
 * Salva a seleção: cria um marcador ou funde com os que ela encosta
 * (versículos unidos, notas mantidas uma embaixo da outra, id/data do mais antigo).
 */
export function mergeSelection<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  sel: VerseSelection,
  options: { now: T; newId: string; note?: string },
): BookmarkResult<T> {
  const { now, newId } = options
  const newNote = cleanNote(options.note)
  const hit = overlappingBookmarks(items, sel)

  if (!hit.length) {
    if (items.length >= MAX_BIBLE_BOOKMARKS) return { ok: false, error: 'limit' }
    if (newNote && newNote.length > MAX_BOOKMARK_NOTE_LENGTH) return { ok: false, error: 'note-too-long' }
    const created = buildBookmark({
      id: newId,
      bookId: sel.bookId,
      chapter: sel.chapter,
      verses: sortedUnique(sel.verses),
      note: newNote,
      created_at: now,
    })
    return { ok: true, items: [...items, created] }
  }

  const note = [...hit]
    .sort((a, b) => a.verses[0] - b.verses[0])
    .map((b) => b.note)
    .concat(newNote)
    .filter((n): n is string => !!n)
    .join('\n\n')
  if (note.length > MAX_BOOKMARK_NOTE_LENGTH) return { ok: false, error: 'note-too-long' }

  const oldest = hit.reduce((a, b) => (b.created_at.toMillis() < a.created_at.toMillis() ? b : a))
  const merged = buildBookmark({
    id: oldest.id,
    bookId: sel.bookId,
    chapter: sel.chapter,
    verses: sortedUnique([...sel.verses, ...hit.flatMap((b) => b.verses)]),
    note: note || undefined,
    created_at: oldest.created_at,
    updated_at: now,
  })
  return { ok: true, items: [...items.filter((i) => !hit.includes(i)), merged] }
}

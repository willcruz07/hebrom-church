import { BIBLE_BOOKS } from './books.generated.ts'
import { bookHref, chapterHref } from './catalog.ts'
import { normalize } from './text.ts'
import type { BibleBookMeta } from './types.ts'

export interface ParsedReference {
  book: BibleBookMeta
  chapter?: number
  verse?: number
}

// [número do livro] nome [capítulo [:versículo] [-fim]]
const PATTERN = /^([1-3])?\s*(\p{L}+)\.?\s*(?:(\d+)(?:\s*[:.,]\s*(\d+))?(?:\s*-\s*\d+)?)?$/u

const compactName = (book: BibleBookMeta) => book.name.toLowerCase().replace(/\s+/g, '')

function findBook(raw: string): BibleBookMeta | null {
  const key = normalize(raw)
  return (
    // 1º nome exato com acento ("jó" → Jó), antes das abreviações ("jo" → João)
    BIBLE_BOOKS.find((b) => compactName(b) === raw) ??
    BIBLE_BOOKS.find((b) => b.abbrevs.includes(key)) ??
    BIBLE_BOOKS.find((b) => normalize(compactName(b)) === key) ??
    uniquePrefix(key)
  )
}

function uniquePrefix(key: string): BibleBookMeta | null {
  if (key.replace(/^\d/, '').length < 3) return null
  const found = BIBLE_BOOKS.filter((b) => normalize(compactName(b)).startsWith(key))
  return found.length === 1 ? found[0] : null
}

/** "jo 3:16", "1co13", "Sl 23", "joão" → livro/capítulo/versículo; null se não for referência válida. */
export function parseReference(input: string): ParsedReference | null {
  const match = input.trim().toLowerCase().replace(/\s+/g, ' ').match(PATTERN)
  if (!match) return null

  const [, number = '', word, ch, vs] = match
  const book = findBook(number + word)
  if (!book) return null
  if (!ch) return { book }

  let chapter = Number(ch)
  let verse = vs ? Number(vs) : undefined
  // Livro de um capítulo só: "Judas 3" é o versículo 3
  if (verse === undefined && book.verses.length === 1 && chapter > 1) {
    verse = chapter
    chapter = 1
  }

  if (chapter < 1 || chapter > book.verses.length) return null
  if (verse === undefined) return { book, chapter }
  if (verse < 1 || verse > book.verses[chapter - 1]) return null
  return { book, chapter, verse }
}

export function referenceHref(ref: ParsedReference): string {
  return ref.chapter ? chapterHref(ref.book.slug, ref.chapter, ref.verse) : bookHref(ref.book.slug)
}

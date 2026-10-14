import { ROUTES } from '../../paths.ts'
import { BIBLE_BOOKS } from './books.generated.ts'
import type { BibleBookMeta, Testament, VerseRef } from './types.ts'

export const findBookBySlug = (slug: string) => BIBLE_BOOKS.find((b) => b.slug === slug) ?? null
export const findBookById = (id: string) => BIBLE_BOOKS.find((b) => b.id === id) ?? null
export const booksOf = (testament: Testament) => BIBLE_BOOKS.filter((b) => b.testament === testament)

export function isValidChapter(book: BibleBookMeta, chapter: number): boolean {
  return Number.isInteger(chapter) && chapter >= 1 && chapter <= book.verses.length
}

export function isValidVerse(book: BibleBookMeta, chapter: number, verse: number): boolean {
  return isValidChapter(book, chapter) && Number.isInteger(verse) && verse >= 1 && verse <= book.verses[chapter - 1]
}

/** Endereço estável do versículo, ex.: "JHN.3.16" (usado nos marcadores). */
export const toRefKey = (ref: VerseRef) => `${ref.bookId}.${ref.chapter}.${ref.verse}`

export function parseRefKey(key: string): VerseRef | null {
  const [bookId, c, v] = key.split('.')
  const book = findBookById(bookId)
  const chapter = Number(c)
  const verse = Number(v)
  if (!book || !isValidVerse(book, chapter, verse)) return null
  return { bookId, chapter, verse }
}

export function formatRef(ref: VerseRef): string {
  return `${findBookById(ref.bookId)?.name ?? ref.bookId} ${ref.chapter}:${ref.verse}`
}

export const bookHref = (slug: string) => `${ROUTES.AUTHENTICATED.BIBLE}/${slug}`

export const chapterHref = (slug: string, chapter: number, verse?: number) =>
  `${bookHref(slug)}/${chapter}${verse ? `?v=${verse}` : ''}`

export function verseHref(ref: VerseRef): string {
  return chapterHref(findBookById(ref.bookId)?.slug ?? '', ref.chapter, ref.verse)
}

export interface ChapterLink {
  slug: string
  name: string
  chapter: number
}

/** Capítulo seguinte (1) ou anterior (-1), atravessando livros; null nas pontas da Bíblia. */
export function adjacentChapter(slug: string, chapter: number, direction: 1 | -1): ChapterLink | null {
  const index = BIBLE_BOOKS.findIndex((b) => b.slug === slug)
  if (index < 0) return null

  const book = BIBLE_BOOKS[index]
  const target = chapter + direction
  if (target >= 1 && target <= book.verses.length) return { slug, name: book.name, chapter: target }

  const other = BIBLE_BOOKS[index + direction]
  if (!other) return null
  return { slug: other.slug, name: other.name, chapter: direction === 1 ? 1 : other.verses.length }
}

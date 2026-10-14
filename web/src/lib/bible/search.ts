import { normalize } from './text.ts'
import type { BibleBookText } from './types.ts'

export const MIN_SEARCH_LENGTH = 3
export const MAX_SEARCH_RESULTS = 50

export interface SearchHit {
  bookId: string
  chapter: number
  verse: number
  text: string
}

/** Busca por palavra só sem números: "jo 3:16" é referência e não deve baixar a Bíblia inteira. */
export function isWordQuery(query: string): boolean {
  const q = normalize(query.trim())
  return q.length >= MIN_SEARCH_LENGTH && !/\d/.test(q)
}

// Normalizar 31 mil versículos a cada tecla seria desperdício: guarda por livro
const normalizedCache = new WeakMap<BibleBookText, string[][]>()

function normalizedChapters(book: BibleBookText): string[][] {
  let chapters = normalizedCache.get(book)
  if (!chapters) {
    chapters = book.chapters.map((verses) => verses.map(normalize))
    normalizedCache.set(book, chapters)
  }
  return chapters
}

/** Versículos que contêm o termo (sem acento/maiúscula), na ordem dos livros recebidos. */
export function searchVerses(books: BibleBookText[], query: string, limit = MAX_SEARCH_RESULTS): SearchHit[] {
  const q = normalize(query.trim())
  if (q.length < MIN_SEARCH_LENGTH) return []

  const hits: SearchHit[] = []
  for (const book of books) {
    const chapters = normalizedChapters(book)
    for (let c = 0; c < chapters.length; c++) {
      for (let v = 0; v < chapters[c].length; v++) {
        if (!chapters[c][v].includes(q)) continue
        hits.push({ bookId: book.id, chapter: c + 1, verse: v + 1, text: book.chapters[c][v] })
        if (hits.length >= limit) return hits
      }
    }
  }
  return hits
}

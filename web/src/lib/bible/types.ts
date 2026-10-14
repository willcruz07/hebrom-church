export type Testament = 'VT' | 'NT'

/** Metadados de um livro (vêm do catálogo gerado, sem o texto). */
export interface BibleBookMeta {
  /** Código USFX, ex.: "JHN". Base do endereço dos marcadores. */
  id: string
  /** Usado na URL, ex.: "joao", "1-corintios". */
  slug: string
  name: string
  testament: Testament
  /** Abreviações em minúsculas, sem acento e sem espaço, ex.: ["jo", "joa"]. */
  abbrevs: string[]
  /** verses[i] = quantidade de versículos do capítulo i + 1. */
  verses: number[]
}

/** Texto de um livro: chapters[c][v] = capítulo c + 1, versículo v + 1. */
export interface BibleBookText {
  id: string
  slug: string
  name: string
  chapters: string[][]
}

export interface VerseRef {
  bookId: string
  chapter: number
  verse: number
}

/** O que as regras precisam de um Timestamp do Firestore (permite testar sem Firebase). */
export interface TimestampLike {
  toMillis(): number
}

/** Marcador de trecho: versículos de um único capítulo, com nota opcional. */
export interface BibleBookmark<T extends TimestampLike = TimestampLike> {
  id: string
  bookId: string
  chapter: number
  /** Ordenado crescente, sem repetição, pelo menos 1. */
  verses: number[]
  /** Ausente = sem nota (o Firestore recusa `undefined`). */
  note?: string
  created_at: T
  updated_at?: T
}

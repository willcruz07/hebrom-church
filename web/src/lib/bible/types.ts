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

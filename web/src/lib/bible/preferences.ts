// Conveniências do aparelho (localStorage): nada crítico depende delas
const FONT_KEY = 'hebrom:bible:font'
const LAST_READ_KEY = 'hebrom:bible:last'

export const FONT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl'] as const
const DEFAULT_FONT_SIZE = 1

export function readFontSize(): number {
  try {
    const raw = localStorage.getItem(FONT_KEY)
    const n = Number(raw)
    return raw !== null && Number.isInteger(n) && n >= 0 && n < FONT_SIZES.length ? n : DEFAULT_FONT_SIZE
  } catch {
    return DEFAULT_FONT_SIZE
  }
}

export function saveFontSize(index: number): void {
  try {
    localStorage.setItem(FONT_KEY, String(index))
  } catch {
    // armazenamento indisponível
  }
}

export interface LastRead {
  slug: string
  chapter: number
}

export function readLastRead(): LastRead | null {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_READ_KEY) ?? 'null')
    return value && typeof value.slug === 'string' && typeof value.chapter === 'number' ? value : null
  } catch {
    return null
  }
}

export function saveLastRead(slug: string, chapter: number): void {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ slug, chapter }))
  } catch {
    // armazenamento indisponível
  }
}

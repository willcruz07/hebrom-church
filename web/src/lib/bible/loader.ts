import { BIBLE_BOOKS } from './books.generated'
import type { BibleBookText } from './types'

// Trocar o texto no futuro = novo nome de cache; os antigos são apagados no prefetch
const CACHE_NAME = 'bible-almeida-v1'
const CACHE_PREFIX = 'bible-almeida-'
const PARALLEL_DOWNLOADS = 6

const bookUrl = (slug: string) => `/bible/almeida/${slug}.json`
const loaded = new Map<string, Promise<BibleBookText>>()

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(CACHE_NAME)
  } catch {
    // Janela privada / armazenamento bloqueado: segue só com a rede
    return null
  }
}

async function fetchBook(slug: string): Promise<BibleBookText> {
  const url = bookUrl(slug)
  const cache = await openCache()
  const cached = await cache?.match(url)
  if (cached) return cached.json()

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Falha ao baixar ${slug}: ${response.status}`)
  await cache?.put(url, response.clone()).catch(() => {})
  return response.json()
}

/** Texto do livro: memória → Cache Storage → rede. */
export function getBook(slug: string): Promise<BibleBookText> {
  let promise = loaded.get(slug)
  if (!promise) {
    promise = fetchBook(slug)
    loaded.set(slug, promise)
    // Falhou (ex.: offline): sai da memória para o "Tentar de novo" buscar outra vez
    promise.catch(() => loaded.delete(slug))
  }
  return promise
}

/** Todos os livros, na ordem canônica. Baixa o que faltar, em lotes. */
export async function getAllBooks(onProgress?: (done: number, total: number) => void): Promise<BibleBookText[]> {
  const books: BibleBookText[] = []
  for (let i = 0; i < BIBLE_BOOKS.length; i += PARALLEL_DOWNLOADS) {
    const batch = BIBLE_BOOKS.slice(i, i + PARALLEL_DOWNLOADS)
    books.push(...(await Promise.all(batch.map((b) => getBook(b.slug)))))
    onProgress?.(books.length, BIBLE_BOOKS.length)
  }
  return books
}

async function deleteOldCaches() {
  try {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k)))
  } catch {
    // sem Cache Storage: nada a limpar
  }
}

let prefetchStarted = false

/** Baixa a Bíblia inteira para o aparelho quando o navegador estiver ocioso (uma vez por sessão). */
export function prefetchBible(): void {
  if (prefetchStarted || typeof window === 'undefined') return
  prefetchStarted = true

  const run = () => {
    void deleteOldCaches()
    getAllBooks().catch(() => {
      // Sem internet: tenta de novo na próxima visita
      prefetchStarted = false
    })
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run)
  else setTimeout(run, 2000)
}

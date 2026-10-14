'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { formatRef, verseHref } from '@/lib/bible/catalog'
import { getAllBooks } from '@/lib/bible/loader'
import { parseReference, referenceHref } from '@/lib/bible/reference'
import { MAX_SEARCH_RESULTS, isWordQuery, searchVerses, type SearchHit } from '@/lib/bible/search'
import { findMatch } from '@/lib/bible/text'

function Highlighted({ text, query }: { text: string; query: string }) {
  const match = findMatch(text, query)
  if (!match) return <>{text}</>
  const [start, end] = match
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-amber-100 px-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}

/** Uma caixa só: "jo 3:16" leva ao versículo; uma palavra lista os versículos que a contêm. */
export function BibleSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searchedFor, setSearchedFor] = useState('')
  const [progress, setProgress] = useState<number | null>(null)

  const reference = useMemo(() => parseReference(query), [query])
  const term = query.trim()
  const isWordSearch = isWordQuery(term)

  useEffect(() => {
    if (!isWordSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHits([])
      setSearchedFor('')
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const books = await getAllBooks((done, total) => {
          if (!cancelled) setProgress(done < total ? done : null)
        })
        if (cancelled) return
        setHits(searchVerses(books, term))
        setSearchedFor(term)
      } catch {
        if (!cancelled) toast.error('Sem conexão para baixar a Bíblia. Tente novamente.')
      } finally {
        if (!cancelled) setProgress(null)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, isWordSearch])

  const firstHref = reference ? referenceHref(reference) : hits[0] ? verseHref(hits[0]) : null
  const showEmpty = isWordSearch && searchedFor === term && hits.length === 0 && !reference

  return (
    <div className="space-y-3">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (firstHref) router.push(firstHref)
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Buscar: "jo 3:16" ou uma palavra'
          aria-label="Buscar na Bíblia"
          className="h-12 rounded-2xl pl-12 pr-10 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {(reference || progress !== null || hits.length > 0 || showEmpty) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {reference && (
            <Link
              href={referenceHref(reference)}
              className="flex items-center justify-between gap-3 border-b border-slate-100 bg-amber-50/60 px-4 py-3 font-semibold text-amber-800 hover:bg-amber-100/60 dark:border-slate-800 dark:bg-amber-900/20 dark:text-amber-300"
            >
              Ir para {reference.book.name}
              {reference.chapter ? ` ${reference.chapter}` : ''}
              {reference.verse ? `:${reference.verse}` : ''}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          )}

          {progress !== null && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500">
              <HebromSpinner size="sm" />
              Preparando a Bíblia… {progress}/66
            </div>
          )}

          {hits.length > 0 && (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {hits.map((hit) => (
                <li key={`${hit.bookId}.${hit.chapter}.${hit.verse}`}>
                  <Link href={verseHref(hit)} className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{formatRef(hit)}</span>
                    <p className="mt-0.5 font-serif text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      <Highlighted text={hit.text} query={searchedFor} />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {hits.length >= MAX_SEARCH_RESULTS && (
            <p className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400 dark:border-slate-800">
              Mostrando os primeiros {MAX_SEARCH_RESULTS} resultados. Refine a busca para ver outros.
            </p>
          )}

          {showEmpty && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhum versículo com “{term}”.</p>
          )}
        </div>
      )}
    </div>
  )
}

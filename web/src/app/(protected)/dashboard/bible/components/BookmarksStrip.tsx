'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bookmark } from 'lucide-react'
import dayjs from '@/lib/dayjs'
import { findBookById, formatRef, parseRefKey, verseHref } from '@/lib/bible/catalog'
import { getBook } from '@/lib/bible/loader'
import { useAuth } from '@/store/useAuth'
import { useBibleBookmarks } from '@/store/useBibleBookmarks'

const MAX_SHOWN = 20

export function BookmarksStrip() {
  const { currentUser } = useAuth()
  const { items, status, load } = useBibleBookmarks()
  const [texts, setTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  const bookmarks = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
        .slice(0, MAX_SHOWN)
        .flatMap((item) => {
          const ref = parseRefKey(item.ref)
          return ref ? [{ key: item.ref, ref, createdAt: item.created_at }] : []
        }),
    [items],
  )

  // Começo do versículo em cada card (livros já baixados respondem do cache)
  useEffect(() => {
    let cancelled = false
    for (const { key, ref } of bookmarks) {
      const book = findBookById(ref.bookId)
      if (!book) continue
      getBook(book.slug)
        .then((b) => {
          if (!cancelled) setTexts((t) => ({ ...t, [key]: b.chapters[ref.chapter - 1][ref.verse - 1] }))
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [bookmarks])

  if (status === 'error') {
    return <p className="text-sm text-slate-400">Não foi possível carregar seus marcadores agora.</p>
  }
  if (bookmarks.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Meus marcadores</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {bookmarks.map(({ key, ref, createdAt }) => (
          <Link
            key={key}
            href={verseHref(ref)}
            className="w-64 shrink-0 snap-start rounded-2xl border border-amber-200 bg-amber-50/60 p-4 transition-colors hover:border-amber-400 dark:border-amber-900/50 dark:bg-amber-900/10"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              <Bookmark className="h-4 w-4 fill-amber-500 text-amber-500" />
              {formatRef(ref)}
            </span>
            <span className="text-[11px] text-slate-400">{dayjs(createdAt.toDate()).fromNow()}</span>
            <p className="mt-2 line-clamp-2 font-serif text-sm italic text-slate-700 dark:text-slate-200">
              {texts[key] ?? '…'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

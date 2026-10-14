'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Copy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { adjacentChapter, bookHref, chapterHref, findBookBySlug } from '@/lib/bible/catalog'
import { findBookmarkForVerse } from '@/lib/bible/bookmarks'
import { getBook, prefetchBible } from '@/lib/bible/loader'
import { FONT_SIZES, readFontSize, saveFontSize, saveLastRead } from '@/lib/bible/preferences'
import { copyText, shareText } from '@/lib/share'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuth'
import { useBibleBookmarks } from '@/store/useBibleBookmarks'
import { BibleCredit } from './BibleCredit'

interface ChapterReaderProps {
  slug: string
  chapter: number
  /** Versículo vindo de ?v= — rola até ele e destaca por alguns segundos. */
  focusVerse?: number
}

export function ChapterReader({ slug, chapter, focusVerse }: ChapterReaderProps) {
  // A página já validou o slug
  const book = findBookBySlug(slug)!
  const { currentUser } = useAuth()
  const { items, load, saveSelection, remove } = useBibleBookmarks()

  const [verses, setVerses] = useState<string[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [fontSize, setFontSize] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [flash, setFlash] = useState<number | null>(focusVerse ?? null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSize(readFontSize())
  }, [])

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerses(null)
    setFailed(false)
    getBook(slug)
      .then((b) => {
        if (cancelled) return
        setVerses(b.chapters[chapter - 1])
        saveLastRead(slug, chapter)
        prefetchBible()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [slug, chapter, attempt])

  useEffect(() => {
    if (!verses || !focusVerse) return
    document.getElementById(`v${focusVerse}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(timer)
  }, [verses, focusVerse])

  const bookmarkOf = (verse: number) => findBookmarkForVerse(items, book.id, chapter, verse)
  const prev = adjacentChapter(slug, chapter, -1)
  const next = adjacentChapter(slug, chapter, 1)

  const changeFont = (delta: number) => {
    const size = Math.min(FONT_SIZES.length - 1, Math.max(0, fontSize + delta))
    setFontSize(size)
    saveFontSize(size)
  }

  const selectedText = selected && verses ? verses[selected - 1] : ''
  const selectedLabel = `${book.name} ${chapter}:${selected}`
  const selectedBookmark = selected !== null ? bookmarkOf(selected) : null
  const quote = `"${selectedText}"\n— ${selectedLabel}`

  return (
    <article className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={bookHref(slug)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400"
          >
            <ChevronLeft className="h-4 w-4" />
            {book.name}
          </Link>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            {book.name} {chapter}
          </h1>
        </div>
        <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-sm"
            onClick={() => changeFont(-1)}
            disabled={fontSize === 0}
            aria-label="Diminuir letra"
          >
            A−
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-base font-bold"
            onClick={() => changeFont(1)}
            disabled={fontSize === FONT_SIZES.length - 1}
            aria-label="Aumentar letra"
          >
            A+
          </Button>
        </div>
      </header>

      {failed ? (
        <div className="space-y-4 rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
          <p className="text-slate-500">Sem conexão. Este livro ainda não foi baixado.</p>
          <Button variant="outline" className="rounded-full" onClick={() => setAttempt((a) => a + 1)}>
            Tentar de novo
          </Button>
        </div>
      ) : !verses ? (
        <div className="flex justify-center py-20">
          <HebromSpinner size="lg" />
        </div>
      ) : (
        <div className={cn('font-serif leading-relaxed text-slate-800 dark:text-slate-100', FONT_SIZES[fontSize])}>
          {verses.map((text, i) => {
            const verse = i + 1
            return (
              <button
                key={verse}
                id={`v${verse}`}
                type="button"
                onClick={() => setSelected(verse)}
                className={cn(
                  'block w-full scroll-mt-24 rounded-lg px-2 py-1 text-left transition-colors duration-700 hover:bg-amber-50/70 dark:hover:bg-amber-900/10',
                  (flash === verse || selected === verse) && 'bg-amber-100 dark:bg-amber-900/30',
                )}
              >
                <sup className="mr-1 font-sans text-[0.65em] font-bold text-amber-600 dark:text-amber-400">
                  {verse}
                </sup>
                {text}
                {bookmarkOf(verse) && (
                  <Bookmark
                    className="ml-1 inline h-[0.8em] w-[0.8em] fill-amber-500 align-baseline text-amber-500"
                    aria-label="Marcado"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {verses && (
        <nav className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
          {next && (
            <Button
              asChild
              size="lg"
              className="h-auto w-full rounded-2xl bg-amber-600 py-4 text-base shadow-lg shadow-amber-500/20 hover:bg-amber-700"
            >
              <Link href={chapterHref(next.slug, next.chapter)}>
                Próximo: {next.name} {next.chapter}
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          )}
          {prev && (
            <Link
              href={chapterHref(prev.slug, prev.chapter)}
              className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400"
            >
              <ChevronLeft className="h-4 w-4" />
              {prev.name} {prev.chapter}
            </Link>
          )}
        </nav>
      )}

      <BibleCredit />

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{selectedLabel}</SheetTitle>
            <SheetDescription className="line-clamp-3 font-serif italic">{selectedText}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 px-4 pb-6 sm:grid-cols-3">
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!currentUser}
              onClick={() => {
                if (currentUser && selected) {
                  if (selectedBookmark) remove(currentUser.uid, selectedBookmark.id)
                  else saveSelection(currentUser.uid, { bookId: book.id, chapter, verses: [selected] })
                }
                setSelected(null)
              }}
            >
              <Bookmark className={cn('mr-2 h-4 w-4', !!selectedBookmark && 'fill-white')} />
              {selectedBookmark ? 'Remover marcador' : 'Adicionar marcador'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                copyText(quote)
                setSelected(null)
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                shareText(quote)
                setSelected(null)
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </article>
  )
}

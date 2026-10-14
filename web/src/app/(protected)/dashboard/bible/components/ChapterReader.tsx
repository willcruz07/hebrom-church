'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { buildQuote, formatBookmarkRef, overlappingBookmarks, type QuoteEntry } from '@/lib/bible/bookmarks'
import { adjacentChapter, bookHref, chapterHref, findBookBySlug } from '@/lib/bible/catalog'
import { getBook, prefetchBible } from '@/lib/bible/loader'
import { FONT_SIZES, readFontSize, saveFontSize, saveLastRead } from '@/lib/bible/preferences'
import { copyText, shareText } from '@/lib/share'
import { cn } from '@/lib/utils'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
import { useAuth } from '@/store/useAuth'
import { useBibleBookmarks } from '@/store/useBibleBookmarks'
import { useBottomNav } from '@/store/useBottomNav'
import type { BibleBookmark } from '@/types'
import { BibleCredit } from './BibleCredit'
import { BookmarkSheet } from './BookmarkSheet'
import { SelectionBar } from './SelectionBar'
import { VerseActionsSheet } from './VerseActionsSheet'

interface ChapterReaderProps {
  slug: string
  chapter: number
  /** Versículos vindos de ?v= — rola até o primeiro e destaca todos por alguns segundos. */
  focusVerses: number[]
}

export function ChapterReader({ slug, chapter, focusVerses }: ChapterReaderProps) {
  // A página já validou o slug
  const book = findBookBySlug(slug)!
  const { currentUser } = useAuth()
  const { items, load, saveSelection, updateNote, remove } = useBibleBookmarks()

  const [verses, setVerses] = useState<string[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [fontSize, setFontSize] = useState(1)
  const [selection, setSelection] = useState<number[]>([])
  const [actionsOpen, setActionsOpen] = useState(false)
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null)
  const [flash, setFlash] = useState<number[]>(focusVerses)
  const focusKey = focusVerses.join(',')

  // Foco na leitura: a barra inferior sai ao rolar para baixo e enquanto há seleção
  const scrolledAway = useHideOnScroll()
  const setNavHidden = useBottomNav((s) => s.setHidden)
  const navHidden = scrolledAway || selection.length > 0
  useEffect(() => {
    setNavHidden(navHidden)
  }, [navHidden, setNavHidden])
  useEffect(() => () => setNavHidden(false), [setNavHidden])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSize(readFontSize())
  }, [])

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  // Trocar de capítulo limpa a seleção e fecha os sheets
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection([])
    setActionsOpen(false)
    setActiveBookmarkId(null)
  }, [slug, chapter])

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
    if (!verses || !focusKey) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlash(focusKey.split(',').map(Number))
    document.getElementById(`v${focusKey.split(',')[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setFlash([]), 2500)
    return () => clearTimeout(timer)
  }, [verses, focusKey])

  // Versículo → marcador deste capítulo
  const verseBookmark = useMemo(() => {
    const map = new Map<number, BibleBookmark>()
    for (const b of items) {
      if (b.bookId !== book.id || b.chapter !== chapter) continue
      for (const v of b.verses) map.set(v, b)
    }
    return map
  }, [items, book.id, chapter])

  const prev = adjacentChapter(slug, chapter, -1)
  const next = adjacentChapter(slug, chapter, 1)

  const changeFont = (delta: number) => {
    const size = Math.min(FONT_SIZES.length - 1, Math.max(0, fontSize + delta))
    setFontSize(size)
    saveFontSize(size)
  }

  const entriesOf = (list: number[]): QuoteEntry[] =>
    verses ? list.map((verse) => ({ verse, text: verses[verse - 1] })) : []

  const selectionRef = { bookId: book.id, chapter, verses: selection }
  const selectionLabel = formatBookmarkRef(selectionRef)
  const selectionEntries = entriesOf(selection)
  const overlapping = overlappingBookmarks(items, selectionRef)
  const activeBookmark = items.find((b) => b.id === activeBookmarkId) ?? null
  const activeEntries = activeBookmark ? entriesOf(activeBookmark.verses) : []

  const tapVerse = (verse: number) => {
    const marked = verseBookmark.get(verse)
    if (selection.length === 0 && marked) {
      setActiveBookmarkId(marked.id)
      return
    }
    setSelection((s) => (s.includes(verse) ? s.filter((v) => v !== verse) : [...s, verse].sort((a, b) => a - b)))
  }

  const clearSelection = () => {
    setActionsOpen(false)
    setSelection([])
  }

  /** Sem nota fecha na hora (otimista); com nota espera, para o texto não se perder se falhar. */
  const markSelection = async (note?: string) => {
    if (!currentUser) return false
    const pending = saveSelection(currentUser.uid, selectionRef, note)
    if (!note) {
      clearSelection()
      return pending
    }
    const ok = await pending
    if (ok) clearSelection()
    return ok
  }

  const copySelection = () => {
    copyText(buildQuote(selectionEntries, selectionLabel))
    clearSelection()
  }

  const shareSelection = () => {
    shareText(buildQuote(selectionEntries, selectionLabel))
    clearSelection()
  }

  const activeQuote = () => (activeBookmark ? buildQuote(activeEntries, formatBookmarkRef(activeBookmark)) : '')

  return (
    <article
      className={cn('mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500', selection.length > 0 && 'pb-28')}
    >
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
            const marked = verseBookmark.get(verse)
            const isSelected = selection.includes(verse)
            const isLastOfMarker = marked && marked.verses[marked.verses.length - 1] === verse
            return (
              <button
                key={verse}
                id={`v${verse}`}
                type="button"
                onClick={() => tapVerse(verse)}
                aria-pressed={isSelected}
                className={cn(
                  'block w-full scroll-mt-24 rounded-lg px-2 py-1 text-left transition-colors duration-700 hover:bg-amber-50/70 dark:hover:bg-amber-900/10',
                  marked && 'underline decoration-amber-400/70 decoration-dotted underline-offset-4',
                  flash.includes(verse) && 'bg-amber-100 dark:bg-amber-900/30',
                  isSelected &&
                    'bg-amber-100 shadow-[inset_3px_0_0_var(--color-amber-500)] transition-none dark:bg-amber-900/30',
                )}
              >
                <sup className="mr-1 font-sans text-[0.65em] font-bold text-amber-600 dark:text-amber-400">
                  {verse}
                </sup>
                {text}
                {marked &&
                  isLastOfMarker &&
                  (marked.note ? (
                    <NotebookPen
                      className="ml-1 inline h-[0.8em] w-[0.8em] align-baseline text-amber-500"
                      aria-label="Marcado com anotação"
                    />
                  ) : (
                    <Bookmark
                      className="ml-1 inline h-[0.8em] w-[0.8em] fill-amber-500 align-baseline text-amber-500"
                      aria-label="Marcado"
                    />
                  ))}
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

      {selection.length > 0 && (
        <SelectionBar label={selectionLabel} onClear={clearSelection} onConfirm={() => setActionsOpen(true)} />
      )}

      <VerseActionsSheet
        open={actionsOpen}
        label={selectionLabel}
        entries={selectionEntries}
        overlapping={overlapping}
        canMark={!!currentUser}
        onOpenChange={setActionsOpen}
        onMark={markSelection}
        onCopy={copySelection}
        onShare={shareSelection}
      />

      <BookmarkSheet
        bookmark={activeBookmark}
        entries={activeEntries}
        onOpenChange={(open) => !open && setActiveBookmarkId(null)}
        onSaveNote={(note) =>
          currentUser && activeBookmark ? updateNote(currentUser.uid, activeBookmark.id, note) : Promise.resolve(false)
        }
        onRemove={(id) => {
          if (currentUser) remove(currentUser.uid, id)
          setActiveBookmarkId(null)
        }}
        onCopy={() => {
          copyText(activeQuote())
          setActiveBookmarkId(null)
        }}
        onShare={() => {
          shareText(activeQuote())
          setActiveBookmarkId(null)
        }}
      />
    </article>
  )
}

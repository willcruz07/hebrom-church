'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Timestamp } from 'firebase/firestore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { bookmarkHref, formatBookmarkRef, type BookmarkGroup } from '@/lib/bible/bookmarks'
import { findBookById } from '@/lib/bible/catalog'
import { getBook } from '@/lib/bible/loader'

interface BookBookmarksModalProps {
  /** Mantido pelo pai durante o fechamento, para o conteúdo não sumir na animação. */
  group: BookmarkGroup<Timestamp> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type BookText = { slug: string; chapters: string[][] } | { slug: string; error: true }

export function BookBookmarksModal({ group, open, onOpenChange }: BookBookmarksModalProps) {
  const router = useRouter()
  const book = group ? findBookById(group.bookId) : null
  const [text, setText] = useState<BookText | null>(null)

  useEffect(() => {
    if (!open || !book) return
    let cancelled = false
    getBook(book.slug)
      .then((b) => {
        if (!cancelled) setText({ slug: book.slug, chapters: b.chapters })
      })
      .catch(() => {
        if (!cancelled) setText({ slug: book.slug, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [open, book])

  const loaded = text && book && text.slug === book.slug ? text : null
  const excerpt = (chapter: number, verses: number[]) => {
    if (!loaded) return '…'
    if ('error' in loaded) return 'Texto indisponível offline'
    return verses.map((v) => loaded.chapters[chapter - 1]?.[v - 1] ?? '').join(' ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black uppercase tracking-tight md:text-2xl">
            {book?.name ?? ''}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-medium md:text-sm">
            {group?.count} {group?.count === 1 ? 'marcador' : 'marcadores'}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {group?.bookmarks.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  router.push(bookmarkHref(b))
                }}
                className="w-full space-y-2 rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-amber-400 dark:border-slate-800"
              >
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{formatBookmarkRef(b)}</span>
                <span className="line-clamp-3 block font-serif text-sm italic text-slate-600 dark:text-slate-300">
                  {excerpt(b.chapter, b.verses)}
                </span>
                {b.note && (
                  <span className="block whitespace-pre-line rounded-xl bg-amber-50 p-3 text-sm text-slate-700 dark:bg-amber-900/15 dark:text-slate-200">
                    {b.note}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

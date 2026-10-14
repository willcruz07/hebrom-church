'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'
import { chapterHref, findBookBySlug, isValidChapter } from '@/lib/bible/catalog'
import { readLastRead } from '@/lib/bible/preferences'

export function ContinueReading() {
  const [last, setLast] = useState<{ href: string; label: string } | null>(null)

  useEffect(() => {
    const saved = readLastRead()
    const book = saved && findBookBySlug(saved.slug)
    if (!saved || !book || !isValidChapter(book, saved.chapter)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLast({ href: chapterHref(book.slug, saved.chapter), label: `${book.name} ${saved.chapter}` })
  }, [])

  if (!last) return null

  return (
    <Link
      href={last.href}
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-4 text-white shadow-lg shadow-amber-500/20 transition-transform hover:-translate-y-0.5"
    >
      <BookOpen className="h-6 w-6 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-widest text-amber-100">
          Continuar de onde parou
        </span>
        <span className="block truncate font-serif text-lg font-bold">{last.label}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0" />
    </Link>
  )
}

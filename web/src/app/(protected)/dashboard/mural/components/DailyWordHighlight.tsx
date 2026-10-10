'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { getDailyWord } from '@/services/firebase/daily-word'
import { getDailyWordTheme } from '@/lib/daily-word-themes'
import { ROUTES } from '@/paths'
import dayjs from '@/lib/dayjs'
import { DailyWord } from '@/types'

/** Destaque da Palavra/Devocional de hoje no topo do mural (some se não houver palavra). */
export function DailyWordHighlight() {
  const [word, setWord] = useState<DailyWord | null>(null)

  useEffect(() => {
    getDailyWord(dayjs().format('YYYY-MM-DD'))
      .then(setWord)
      .catch((error) => console.error('Erro ao carregar a palavra de hoje:', error))
  }, [])

  if (!word) return null
  const theme = getDailyWordTheme(word.theme)

  return (
    <Link
      href={ROUTES.AUTHENTICATED.DAILY_WORD}
      className="group relative block overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition-all hover:shadow-md dark:border-amber-900/40 dark:from-amber-900/20 dark:to-slate-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          <BookOpen className="h-4 w-4" />
          Palavra de hoje
        </span>
        <span className="text-xs text-slate-500">
          {theme.icon} {theme.label}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 font-serif text-base italic leading-relaxed text-slate-800 dark:text-slate-100">
        “{word.content}”
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {word.reference ? (
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            — {word.reference}
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400">
          Ler
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

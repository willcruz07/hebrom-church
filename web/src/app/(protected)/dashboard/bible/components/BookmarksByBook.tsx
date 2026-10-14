'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark } from 'lucide-react'
import dayjs from '@/lib/dayjs'
import { groupByBook } from '@/lib/bible/bookmarks'
import { findBookById } from '@/lib/bible/catalog'
import { useAuth } from '@/store/useAuth'
import { useBibleBookmarks } from '@/store/useBibleBookmarks'
import { BookBookmarksModal } from './BookBookmarksModal'

export function BookmarksByBook() {
  const { currentUser } = useAuth()
  const { items, status, load } = useBibleBookmarks()
  // bookId fica guardado ao fechar, para o modal não esvaziar durante a animação de saída
  const [modal, setModal] = useState<{ bookId: string | null; open: boolean }>({ bookId: null, open: false })

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  const groups = useMemo(() => groupByBook(items), [items])
  const modalGroup = groups.find((g) => g.bookId === modal.bookId) ?? null

  if (status === 'error') {
    return <p className="text-sm text-slate-400">Não foi possível carregar seus marcadores agora.</p>
  }
  if (groups.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Meus marcadores</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {groups.map((group) => (
          <button
            key={group.bookId}
            type="button"
            onClick={() => setModal({ bookId: group.bookId, open: true })}
            className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left transition-colors hover:border-amber-400 dark:border-amber-900/50 dark:bg-amber-900/10"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              <Bookmark className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" />
              <span className="truncate">{findBookById(group.bookId)?.name ?? group.bookId}</span>
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {group.count} {group.count === 1 ? 'marcador' : 'marcadores'}
            </span>
            {group.withNote > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{group.withNote} com nota</span>
            )}
            <span className="text-[11px] text-slate-400">{dayjs(group.lastActivity).fromNow()}</span>
          </button>
        ))}
      </div>

      <BookBookmarksModal
        group={modalGroup}
        open={modal.open && !!modalGroup}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
      />
    </section>
  )
}

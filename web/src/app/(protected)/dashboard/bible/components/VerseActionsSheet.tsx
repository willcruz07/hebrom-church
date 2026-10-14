'use client'

import { useState } from 'react'
import { Bookmark, Copy, NotebookPen, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatBookmarkRef, type QuoteEntry } from '@/lib/bible/bookmarks'
import type { BibleBookmark } from '@/types'
import { NoteEditor } from './NoteEditor'

interface VerseActionsSheetProps {
  open: boolean
  label: string
  entries: QuoteEntry[]
  /** Marcadores existentes que a seleção encosta (serão unidos ao marcar). */
  overlapping: BibleBookmark[]
  canMark: boolean
  onOpenChange: (open: boolean) => void
  onMark: (note?: string) => Promise<boolean>
  onCopy: () => void
  onShare: () => void
}

export function VerseActionsSheet({
  open,
  label,
  entries,
  overlapping,
  canMark,
  onOpenChange,
  onMark,
  onCopy,
  onShare,
}: VerseActionsSheetProps) {
  const [editing, setEditing] = useState(false)

  const changeOpen = (next: boolean) => {
    if (!next) setEditing(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent variant="sheet" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">{label}</DialogTitle>
          <DialogDescription className="line-clamp-3 font-serif italic">
            {entries.map((e) => e.text).join(' ')}
          </DialogDescription>
        </DialogHeader>

        {overlapping.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Inclui {overlapping.map(formatBookmarkRef).join('; ')}, que já está marcado. Os trechos serão unidos.
            </p>
            {overlapping
              .filter((b) => b.note)
              .map((b) => (
                <p key={b.id} className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                  {b.note}
                </p>
              ))}
          </div>
        )}

        {editing ? (
          <NoteEditor onSave={(note) => onMark(note)} onCancel={() => setEditing(false)} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-11 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700"
              disabled={!canMark}
              onClick={() => onMark()}
            >
              <Bookmark className="mr-2 h-4 w-4" />
              Marcar
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" disabled={!canMark} onClick={() => setEditing(true)}>
              <NotebookPen className="mr-2 h-4 w-4" />
              Adicionar nota
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

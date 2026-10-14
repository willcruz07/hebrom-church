'use client'

import { useState } from 'react'
import { Copy, NotebookPen, Share2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMessages } from '@/hooks/useMessages'
import { formatBookmarkRef, type QuoteEntry } from '@/lib/bible/bookmarks'
import type { BibleBookmark } from '@/types'
import { NoteEditor } from './NoteEditor'

interface BookmarkSheetProps {
  /** Marcador aberto; `null` fecha o sheet. */
  bookmark: BibleBookmark | null
  entries: QuoteEntry[]
  onOpenChange: (open: boolean) => void
  onSaveNote: (note: string) => Promise<boolean>
  /** Recebe o id: com nota, a confirmação chega depois que o sheet já fechou. */
  onRemove: (id: string) => void
  onCopy: () => void
  onShare: () => void
}

export function BookmarkSheet({
  bookmark,
  entries,
  onOpenChange,
  onSaveNote,
  onRemove,
  onCopy,
  onShare,
}: BookmarkSheetProps) {
  const { confirm } = useMessages()
  const [editing, setEditing] = useState(false)

  const changeOpen = (next: boolean) => {
    if (!next) setEditing(false)
    onOpenChange(next)
  }

  const saveNote = async (note: string) => {
    const ok = await onSaveNote(note)
    if (ok) setEditing(false)
    return ok
  }

  const handleRemove = async () => {
    if (!bookmark) return
    const id = bookmark.id
    if (!bookmark.note) {
      onRemove(id)
      return
    }
    // Fecha o sheet antes, para a confirmação não abrir por cima de outro modal
    changeOpen(false)
    const confirmed = await confirm({
      title: 'Remover marcador',
      description: 'A anotação deste trecho também será apagada.',
      confirmText: 'Remover',
      destructive: true,
    })
    if (confirmed) onRemove(id)
  }

  return (
    <Dialog open={!!bookmark} onOpenChange={changeOpen}>
      <DialogContent variant="sheet" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">
            {bookmark ? formatBookmarkRef(bookmark) : ''}
          </DialogTitle>
          <DialogDescription className="line-clamp-3 font-serif italic">
            {entries.map((e) => e.text).join(' ')}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <NoteEditor initialNote={bookmark?.note} onSave={saveNote} onCancel={() => setEditing(false)} />
        ) : (
          <>
            {bookmark?.note ? (
              <p className="whitespace-pre-line rounded-xl bg-amber-50 p-4 text-sm text-slate-700 dark:bg-amber-900/15 dark:text-slate-200">
                {bookmark.note}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Sem anotação.</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="col-span-2 h-11 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700"
                onClick={() => setEditing(true)}
              >
                <NotebookPen className="mr-2 h-4 w-4" />
                {bookmark?.note ? 'Editar nota' : 'Adicionar nota'}
              </Button>
              <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              <Button
                variant="ghost"
                className="col-span-2 h-11 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleRemove}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover marcador
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

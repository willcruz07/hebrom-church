'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Textarea } from '@/components/ui/textarea'
import { MAX_BOOKMARK_NOTE_LENGTH } from '@/lib/bible/bookmarks'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  initialNote?: string
  /** `true` = salvou; com `false` o texto continua no campo para tentar de novo. */
  onSave: (note: string) => Promise<boolean>
  onCancel: () => void
}

export function NoteEditor({ initialNote = '', onSave, onCancel }: NoteEditorProps) {
  const [note, setNote] = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const nearLimit = note.length >= MAX_BOOKMARK_NOTE_LENGTH - 100

  const save = async () => {
    setSaving(true)
    await onSave(note)
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_BOOKMARK_NOTE_LENGTH}
          placeholder="O que você quer lembrar sobre este trecho?"
          className="min-h-[120px] rounded-xl border-slate-200 focus:ring-amber-500 dark:border-slate-800"
        />
        <p className={cn('text-right text-[11px] font-medium text-slate-400', nearLimit && 'text-red-500')}>
          {note.length}/{MAX_BOOKMARK_NOTE_LENGTH}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
        >
          {saving ? <HebromSpinner size="sm" className="brightness-200" /> : 'Salvar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

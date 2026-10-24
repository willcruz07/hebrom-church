'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface ListSingleSelectOption {
  id: string
  label: string
  /** Bolinha de cor antes do texto (ex: cor da atribuição na carteirinha). */
  color?: string
}

interface ListSingleSelectProps {
  options: ListSingleSelectOption[]
  selected?: string
  onChange: (next: string | undefined) => void
  title: string
  placeholder?: string
  emptyMessage?: string
}

/**
 * Par de seleção única do ChipMultiSelect, para listas longas demais para um Select:
 * abre um sheet com uma linha por opção. Tocar numa opção seleciona e fecha; tocar na
 * opção já selecionada desmarca (fica sem valor) e mantém o sheet aberto para trocar.
 */
export function ListSingleSelect({
  options,
  selected,
  onChange,
  title,
  placeholder = 'Nenhum',
  emptyMessage = 'Nenhuma opção disponível.',
}: ListSingleSelectProps) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.id === selected)

  const pick = (id: string) => {
    if (id === selected) {
      onChange(undefined)
      return
    }
    onChange(id)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span className="flex min-w-0 items-center gap-2">
            {current?.color && (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: current.color }}
              />
            )}
            <span className={cn('truncate', !current && 'text-slate-400')}>
              {current?.label ?? placeholder}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ul className="mx-auto flex w-full max-w-lg flex-col gap-1 overflow-y-auto px-4 pb-6">
          {options.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-500">{emptyMessage}</li>
          )}
          {options.map((option) => {
            const isSelected = option.id === selected
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => pick(option.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all',
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300'
                      : 'border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  {option.color && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      isSelected
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-slate-300 dark:border-slate-700',
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}

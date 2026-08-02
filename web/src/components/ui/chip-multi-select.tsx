'use client'

import { CheckCircle2, ChevronDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface ChipMultiSelectOption {
  id: string
  label: string
}

interface ChipMultiSelectProps {
  options: ChipMultiSelectOption[]
  selected: string[]
  onChange: (next: string[]) => void
  triggerLabel: string
  title: string
  emptyMessage?: string
}

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  triggerLabel,
  title,
  emptyMessage = 'Nenhuma opção disponível.',
}: ChipMultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span className="truncate">
            {triggerLabel}
            {selected.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {selected.length}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto px-4 pb-6 sm:grid-cols-3">
          {options.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              {emptyMessage}
            </p>
          )}
          {options.map((option) => {
            const isSelected = selected.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                  isSelected
                    ? 'border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-none'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    isSelected
                      ? 'border-white/40 bg-white/20'
                      : 'border-slate-300 dark:border-slate-700',
                  )}
                >
                  {isSelected && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

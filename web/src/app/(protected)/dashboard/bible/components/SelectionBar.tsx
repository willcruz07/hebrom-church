'use client'

import { Check, X } from 'lucide-react'

interface SelectionBarProps {
  /** Referência da seleção, ex.: "Levítico 27:1-3, 7". */
  label: string
  onClear: () => void
  onConfirm: () => void
}

/**
 * Barra flutuante da seleção de versículos: sem overlay, o texto continua rolável.
 * Ocupa o lugar da barra inferior, que o leitor esconde enquanto há seleção.
 */
export function SelectionBar({ label, onClear, onConfirm }: SelectionBarProps) {
  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-amber-200 bg-white/95 p-2 pl-4 shadow-2xl shadow-amber-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 dark:border-amber-900/50 dark:bg-slate-900/95 lg:bottom-6">
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Limpar seleção"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onConfirm}
        aria-label="Continuar com a seleção"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 active:scale-95"
      >
        <Check className="h-5 w-5" />
      </button>
    </div>
  )
}

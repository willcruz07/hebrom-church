import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageTitleProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  className?: string
  descriptionClassName?: string
}

/** Título + descrição padrão das telas. Tamanho fluido (`text-fluid-title`), igual em todo o app. */
export function PageTitle({ title, description, icon, className, descriptionClassName }: PageTitleProps) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <h1 className="flex items-center gap-2 text-fluid-title font-black tracking-tight text-slate-900 dark:text-white">
        {icon}
        {title}
      </h1>
      {description && (
        <p className={cn('text-sm md:text-base text-slate-500 dark:text-slate-400', descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  )
}

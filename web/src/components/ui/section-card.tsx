import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SectionCardProps {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  contentClassName?: string
}

/** Card de seção de formulário (barra âmbar + título + descrição), padrão das fichas de membro. */
export function SectionCard({ title, description, children, contentClassName }: SectionCardProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
      <div className="h-1.5 bg-amber-600 w-full" />
      <CardHeader>
        <CardTitle className="text-xl md:text-base font-black">{title}</CardTitle>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

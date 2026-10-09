'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SwipeableRow } from '@/components/ui/SwipeableRow'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export interface DataAction<T> {
  label: string
  icon?: React.ReactNode
  onClick: (item: T) => void
  variant?: 'default' | 'destructive' | 'success'
}

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  headerClassName?: string
  meta?: {
    isTitle?: boolean
    isSubtitle?: boolean
    isAvatar?: boolean
    hideOnMobile?: boolean
  }
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  renderMobileCard?: (item: T) => React.ReactNode
  onRowClick?: (item: T) => void
  actions?: (item: T) => DataAction<T>[]
  /**
   * Mobile: ações reveladas ao deslizar o card da direita para a esquerda (e num bottom
   * sheet via pressão longa). Sem isto, o mobile usa o menu "…" de `actions`.
   * Exige `getRowKey`. Ver specs/lista-swipe-actions.md.
   */
  mobileActions?: (item: T) => DataAction<T>[]
  getRowKey?: (item: T) => string
  /** Título do bottom sheet de ações (pressão longa) */
  getActionsTitle?: (item: T) => string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado.',
  renderMobileCard,
  onRowClick,
  actions,
  mobileActions,
  getRowKey,
  getActionsTitle,
}: DataTableProps<T>) {
  const useSwipe = Boolean(mobileActions && getRowKey)
  const [openRowKey, setOpenRowKey] = useState<string | null>(null)
  const [sheetItem, setSheetItem] = useState<T | null>(null)

  // Rolar a lista fecha o card aberto (scroll não borbulha, por isso capture)
  useEffect(() => {
    if (openRowKey === null) return
    const close = () => setOpenRowKey(null)
    document.addEventListener('scroll', close, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', close, { capture: true })
  }, [openRowKey])

  const renderActions = (item: T) => {
    const itemActions = actions?.(item)
    if (!itemActions || itemActions.length === 0) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {itemActions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick(item)
              }}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
              )}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderDefaultMobileCard = (item: T) => {
    const titleCol = columns.find((col) => col.meta?.isTitle)
    const subtitleCol = columns.find((col) => col.meta?.isSubtitle)
    const avatarCol = columns.find((col) => col.meta?.isAvatar)
    const otherCols = columns.filter(
      (col) => !col.meta?.isTitle && !col.meta?.isSubtitle && !col.meta?.isAvatar && !col.meta?.hideOnMobile
    )

    return (
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {avatarCol && (
              <div className="flex-shrink-0">
                {avatarCol.cell ? avatarCol.cell(item) : (item[avatarCol.accessorKey as keyof T] as React.ReactNode)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {titleCol && titleCol !== avatarCol && (
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {titleCol.cell ? titleCol.cell(item) : (item[titleCol.accessorKey as keyof T] as React.ReactNode)}
                </h3>
              )}
              {subtitleCol && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {subtitleCol.cell ? subtitleCol.cell(item) : (item[subtitleCol.accessorKey as keyof T] as React.ReactNode)}
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">{renderActions(item)}</div>
        </div>

        {otherCols.length > 0 && (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            {otherCols.map((col, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {col.header}
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Desktop Skeleton */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                {columns.map((col, i) => (
                  <TableHead key={i} className={cn('px-6 py-4', col.headerClassName)}>
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="w-[70px]">
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-6 py-4">
                      <div className="h-6 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="px-6 py-4">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
            />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center px-6">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    'px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[70px] px-6 py-4" />}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((item, i) => (
              <TableRow
                key={i}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className={cn('px-6 py-4', col.className)}>
                    {col.cell
                      ? col.cell(item)
                      : (item[col.accessorKey as keyof T] as React.ReactNode)}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="px-6 py-4 text-right">
                    {renderActions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      {useSwipe ? (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          <AnimatePresence initial={false}>
            {data.map((item) => {
              const key = getRowKey!(item)
              const itemActions = mobileActions!(item)

              return (
                <motion.div
                  key={key}
                  layout="position"
                  exit={{ opacity: 0, height: 0, marginTop: -16 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <SwipeableRow
                    isOpen={openRowKey === key}
                    onOpenChange={(open) => setOpenRowKey(open ? key : null)}
                    onTap={() => {
                      if (openRowKey !== null) setOpenRowKey(null)
                      else onRowClick?.(item)
                    }}
                    onLongPress={itemActions.length > 0 ? () => setSheetItem(item) : undefined}
                    actions={itemActions.map((action) => ({
                      label: action.label,
                      icon: action.icon,
                      variant: action.variant,
                      onClick: () => action.onClick(item),
                    }))}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    {renderMobileCard ? renderMobileCard(item) : renderDefaultMobileCard(item)}
                  </SwipeableRow>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Alternativa ao gesto: pressão longa abre as mesmas ações */}
          <Sheet open={sheetItem !== null} onOpenChange={(open) => !open && setSheetItem(null)}>
            <SheetContent side="bottom" className="rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
              <SheetHeader>
                <SheetTitle className="truncate pr-8">
                  {sheetItem && getActionsTitle ? getActionsTitle(sheetItem) : 'Ações'}
                </SheetTitle>
                <SheetDescription className="sr-only">Ações disponíveis para este item</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-2 pb-4">
                {sheetItem &&
                  mobileActions!(sheetItem).map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => {
                        const item = sheetItem
                        setSheetItem(null)
                        action.onClick(item)
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors active:bg-slate-100 dark:active:bg-slate-800',
                        action.variant === 'destructive'
                          ? 'text-red-600'
                          : action.variant === 'success'
                            ? 'text-emerald-600'
                            : 'text-slate-700 dark:text-slate-200',
                      )}
                    >
                      <span className="shrink-0 opacity-80">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {data.map((item, i) => (
          <div
            key={i}
            onClick={() => onRowClick?.(item)}
            className={cn(
              'rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 active:scale-[0.98] transition-transform',
              onRowClick && 'cursor-pointer'
            )}
          >
            {renderMobileCard ? renderMobileCard(item) : renderDefaultMobileCard(item)}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}


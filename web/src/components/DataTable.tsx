'use client'

import React from 'react'
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

export interface DataAction<T> {
  label: string
  icon?: React.ReactNode
  onClick: (item: T) => void
  variant?: 'default' | 'destructive'
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
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado.',
  renderMobileCard,
  onRowClick,
  actions,
}: DataTableProps<T>) {
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {avatarCol && (
              <div className="flex-shrink-0">
                {avatarCol.cell ? avatarCol.cell(item) : (item[avatarCol.accessorKey as keyof T] as React.ReactNode)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {titleCol && (
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
    </div>
  )
}


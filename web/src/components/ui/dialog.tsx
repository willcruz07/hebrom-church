'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

/** Arrastar o sheet além disso (px) para baixo fecha o modal. */
const SHEET_DISMISS_DISTANCE = 100

/**
 * - `center` (padrão): modal centralizado — confirmações e conteúdo informativo.
 * - `sheet`: formulários. No mobile vira bottom sheet (encostado nas laterais e no rodapé,
 *   sobe de baixo, fecha arrastando a alça); a partir de `sm` volta a ser centralizado.
 *   A animação de entrada/saída do mobile fica em globals.css.
 */
type DialogVariant = 'center' | 'sheet'

function DialogContent({
  className,
  children,
  showCloseButton = true,
  variant = 'center',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  variant?: DialogVariant
}) {
  const isSheet = variant === 'sheet'
  const contentRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const dragStartY = React.useRef<number | null>(null)

  const setDragOffset = (offset: number, animate: boolean) => {
    const el = contentRef.current
    if (!el) return
    el.style.transition = animate ? 'transform 200ms ease-out' : 'none'
    el.style.transform = offset ? `translateY(${offset}px)` : ''
  }

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return
    setDragOffset(Math.max(0, e.clientY - dragStartY.current), false)
  }

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return
    const offset = e.clientY - dragStartY.current
    dragStartY.current = null
    if (offset > SHEET_DISMISS_DISTANCE) {
      // Sem a transição inline, a animação de saída parte de onde o dedo soltou
      if (contentRef.current) contentRef.current.style.transition = ''
      closeRef.current?.click()
    } else {
      setDragOffset(0, true)
    }
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        data-variant={variant}
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg',
          isSheet &&
            'max-h-[90vh] overflow-y-auto rounded-3xl max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[calc(100dvh-env(safe-area-inset-top)-3rem)] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overscroll-contain max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pt-2 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
          className,
        )}
        {...props}
      >
        {isSheet && (
          // Alça do sheet (só mobile): arrastar para baixo fecha
          <div
            aria-hidden
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="-mb-2 flex cursor-grab touch-none justify-center pt-1 pb-3 sm:hidden"
          >
            <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>
        )}
        {children}
        {isSheet && <DialogPrimitive.Close ref={closeRef} className="hidden" tabIndex={-1} />}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

/**
 * Padrão do app: ação principal primeiro, "Cancelar" depois (`variant="ghost"`, sem borda).
 * No mobile empilha nessa ordem; no desktop fica lado a lado, alinhado à direita.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

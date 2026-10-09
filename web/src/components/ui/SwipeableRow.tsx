'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SwipeAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive' | 'success'
}

interface SwipeableRowProps {
  children: React.ReactNode
  actions: SwipeAction[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onTap?: () => void
  onLongPress?: () => void
  className?: string
}

const ACTION_WIDTH = 76
const LONG_PRESS_MS = 500
// Acima disto o gesto é arrasto/rolagem, não toque (vale para tap e pressão longa)
const TAP_MOVE_TOLERANCE = 8

const actionColors: Record<NonNullable<SwipeAction['variant']>, string> = {
  default: 'bg-slate-500 text-white',
  destructive: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
}

// Card que desliza da direita para a esquerda revelando ações atrás dele (estilo
// Gmail/Outlook). Deslizar só revela — a ação acontece no toque do botão.
// Ver specs/lista-swipe-actions.md.
export function SwipeableRow({
  children,
  actions,
  isOpen,
  onOpenChange,
  onTap,
  onLongPress,
  className,
}: SwipeableRowProps) {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const actionsWidth = actions.length * ACTION_WIDTH

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)
  // O dedo se afastou da origem além da tolerância, ou o framer iniciou um drag
  const movedBeyondTap = useRef(false)
  const longPressFired = useRef(false)

  useEffect(() => {
    animate(
      x,
      isOpen ? -actionsWidth : 0,
      reduceMotion
        ? { type: 'tween', duration: 0.15 }
        : { type: 'spring', stiffness: 500, damping: 40 },
    )
  }, [isOpen, actionsWidth, reduceMotion, x])

  useEffect(() => () => cancelLongPress(), [])

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }

  function handlePointerDown(e: React.PointerEvent) {
    pressOrigin.current = { x: e.clientX, y: e.clientY }
    movedBeyondTap.current = false
    longPressFired.current = false

    if (!onLongPress) return
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      longPressTimer.current = null
      onLongPress()
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pressOrigin.current || movedBeyondTap.current) return
    const dx = Math.abs(e.clientX - pressOrigin.current.x)
    const dy = Math.abs(e.clientY - pressOrigin.current.y)
    if (dx > TAP_MOVE_TOLERANCE || dy > TAP_MOVE_TOLERANCE) {
      movedBeyondTap.current = true
      cancelLongPress()
    }
  }

  // Não usa o onTap do framer: com drag o card acompanha o dedo, o ponteiro nunca "sai"
  // do elemento e o framer conta o fim do swipe como toque (abria o detalhe do membro).
  function handlePointerUp() {
    cancelLongPress()
    const isTap = pressOrigin.current !== null && !movedBeyondTap.current && !longPressFired.current
    pressOrigin.current = null
    if (!isTap) return

    if (isOpen) onOpenChange(false)
    else onTap?.()
  }

  function handlePointerCancel() {
    // Navegador assumiu o gesto (ex: rolagem vertical) — nunca é toque
    cancelLongPress()
    pressOrigin.current = null
  }

  function handleDragStart() {
    movedBeyondTap.current = true
    cancelLongPress()
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const shouldOpen = x.get() < -actionsWidth * 0.4 || info.velocity.x < -400
    // Mesmo estado de antes não re-dispara o effect, então anima de volta aqui
    if (shouldOpen === isOpen) {
      animate(x, shouldOpen ? -actionsWidth : 0, { type: 'spring', stiffness: 500, damping: 40 })
    }
    onOpenChange(shouldOpen)
  }

  if (actions.length === 0) {
    return (
      <div className={cn('cursor-pointer', className)} onClick={onTap}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-y-0 right-0 flex" aria-hidden={!isOpen}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              onOpenChange(false)
              action.onClick()
            }}
            style={{ width: ACTION_WIDTH }}
            className={cn(
              'flex h-full flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide active:brightness-90',
              actionColors[action.variant ?? 'default'],
            )}
          >
            {action.icon}
            <span className="px-1 text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -actionsWidth, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        dragMomentum={false}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => onLongPress && e.preventDefault()}
        className="relative cursor-pointer select-none bg-white [-webkit-touch-callout:none] dark:bg-slate-900"
      >
        {children}
      </motion.div>
    </div>
  )
}

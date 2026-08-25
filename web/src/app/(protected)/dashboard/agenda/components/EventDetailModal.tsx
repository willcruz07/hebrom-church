'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, MapPin, Trash2 } from 'lucide-react'
import { ChurchEvent } from '@/types'
import { agendaService } from '@/services/firebase/agenda'
import { toast } from 'sonner'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import { getCategory } from '../categories'

interface EventDetailModalProps {
  event: ChurchEvent | null
  isOpen: boolean
  onClose: () => void
  canManage: boolean
}

export function EventDetailModal({ event, isOpen, onClose, canManage }: EventDetailModalProps) {
  const [displayEvent, setDisplayEvent] = useState<ChurchEvent | null>(null)

  useEffect(() => {
    if (event) setDisplayEvent(event)
  }, [event])

  if (!displayEvent) return null

  const category = getCategory(displayEvent.category)

  const handleDelete = async () => {
    if (!confirm('Deseja excluir este evento?')) return
    try {
      await agendaService.deleteEvent(displayEvent.id)
      toast.success('Evento excluído')
      onClose()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] overflow-y-auto max-h-[90vh] rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{displayEvent.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {displayEvent.thumbnail_url ? (
              <img
                src={displayEvent.thumbnail_url}
                alt={displayEvent.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center text-white',
                  category.color,
                )}
              >
                <CalendarIcon className="mb-2 h-8 w-8 opacity-50" />
                <span className="text-2xl font-black">{dayjs(displayEvent.date).format('DD')}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {dayjs(displayEvent.date).format('MMM')}
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg',
                  category.color,
                )}
              >
                {displayEvent.category}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {displayEvent.title}
            </h2>
            <p className="text-sm font-medium capitalize text-slate-500 dark:text-slate-400">
              {dayjs(displayEvent.date).format('dddd, D [de] MMMM [de] YYYY')}
            </p>
          </div>

          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">{displayEvent.time}h</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">{displayEvent.location}</span>
            </div>
          </div>

          {displayEvent.description && (
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              {displayEvent.description}
            </p>
          )}
        </div>

        {canManage && (
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="w-full gap-2 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" /> Excluir Evento
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

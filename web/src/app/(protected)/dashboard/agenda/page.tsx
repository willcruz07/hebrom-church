'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { agendaService } from '@/services/firebase/agenda'
import { ChurchEvent, EventCategory } from '@/types'
import { CreateEventModal } from './components/CreateEventModal'
import { EventDetailModal } from './components/EventDetailModal'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { CATEGORIES, getCategory } from './categories'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function AgendaPage() {
  const { permissions } = usePermissions()
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null)
  const [filter, setFilter] = useState<EventCategory | 'Todos'>('Todos')
  const [currentMonth, setCurrentMonth] = useState(dayjs())

  useEffect(() => {
    setLoading(true)
    const unsubscribe = agendaService.subscribeToEvents((data) => {
      setEvents(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const monthEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          (filter === 'Todos' || e.category === filter) && dayjs(e.date).isSame(currentMonth, 'month'),
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  }, [events, filter, currentMonth])

  const nextMonth = () => setCurrentMonth((prev) => prev.add(1, 'month'))
  const prevMonth = () => setCurrentMonth((prev) => prev.subtract(1, 'month'))
  const isCurrentMonth = currentMonth.isSame(dayjs(), 'month')

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Agenda
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
            Eventos, cultos e programações da nossa igreja.
          </p>
        </div>
        {permissions.canManageAgenda && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 hover:shadow-amber-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between md:p-4">
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[150px] text-center text-sm font-black capitalize text-slate-900 dark:text-white md:text-base">
            {currentMonth.format('MMMM [de] YYYY')}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setCurrentMonth(dayjs())}
              className="ml-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            >
              Hoje
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
          <Select value={filter} onValueChange={(value) => setFilter(value as EventCategory | 'Todos')}>
            <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 sm:w-56">
              <SelectValue placeholder="Filtrar por tema" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Todos">Todos os temas</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  <span className={cn('h-2 w-2 rounded-full', cat.dot)} />
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Programação de {currentMonth.format('MMMM')}
          </h3>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
            {monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <HebromSpinner size="md" className="mb-4" />
              <p>Carregando agenda...</p>
            </div>
          ) : monthEvents.length > 0 ? (
            <div className="flex flex-col">
              {monthEvents.map((event, idx) => {
                const category = getCategory(event.category)
                const isLast = idx === monthEvents.length - 1

                return (
                  <div key={event.id} className="flex gap-3 md:gap-4">
                    {/* Timeline rail */}
                    <div className="flex w-3 shrink-0 flex-col items-center pt-6 md:pt-7">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-slate-950',
                          category.dot,
                        )}
                      />
                      {!(isLast && !permissions.canManageAgenda) && (
                        <span className="mt-2 w-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      )}
                    </div>

                    {/* Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="flex-1 min-w-0 pb-4 text-left md:pb-5"
                    >
                      <div className="group flex gap-4 md:gap-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 dark:border-slate-800 dark:bg-slate-900/50">
                        {/* Date block */}
                        <div className="flex shrink-0 flex-col items-center justify-center border-r border-slate-100 pr-4 dark:border-slate-800 md:pr-5">
                          <span className="text-2xl md:text-3xl font-black leading-none text-slate-900 dark:text-white">
                            {dayjs(event.date).format('DD')}
                          </span>
                          <span className="mt-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
                            {dayjs(event.date).format('MMM')}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                          <div className="min-w-0">
                            <span className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <span className={cn('h-1.5 w-1.5 rounded-full', category.dot)} />
                              {event.category}
                            </span>
                            <h4 className="text-base md:text-xl font-black text-slate-900 dark:text-white transition-colors group-hover:text-amber-600">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {event.time}h
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          </div>
                        </div>

                        {event.thumbnail_url && (
                          <img
                            src={event.thumbnail_url}
                            alt=""
                            className="hidden h-16 w-16 shrink-0 rounded-xl object-cover sm:block md:h-20 md:w-20"
                          />
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}

              {permissions.canManageAgenda && (
                <div className="flex gap-3 md:gap-4">
                  <div className="flex w-3 shrink-0 flex-col items-center pt-6 md:pt-7">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group flex flex-1 items-center gap-4 md:gap-5 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-left transition-all hover:border-amber-500/50 hover:bg-amber-50/40 dark:border-slate-800 dark:hover:bg-amber-900/10 md:p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-amber-100 group-hover:text-amber-600 dark:bg-slate-800 dark:group-hover:bg-amber-900/30">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Adicionar novo agendamento
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Nenhum evento neste mês
              </h4>
              <p className="text-slate-500 max-w-xs mt-1">
                Não há atividades registradas para este mês. Troque o mês, ajuste o filtro de tema ou
                adicione um novo evento.
              </p>
              {permissions.canManageAgenda && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-6 w-full md:w-auto rounded-xl bg-amber-600 px-8 py-6 md:py-2 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95"
                >
                  Adicionar Evento
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {}}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        canManage={permissions.canManageAgenda}
      />
    </div>
  )
}

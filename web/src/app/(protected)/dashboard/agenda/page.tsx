'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Filter,
  Search,
  CalendarDays,
  Trash2,
} from 'lucide-react'
import { agendaService } from '@/services/firebase/agenda'
import { ChurchEvent, EventCategory } from '@/types'
import { CreateEventModal } from './components/CreateEventModal'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const CATEGORIES: { name: EventCategory; color: string; dot: string }[] = [
  { name: 'Culto', color: 'bg-blue-500', dot: 'bg-blue-500' },
  { name: 'Evento', color: 'bg-amber-500', dot: 'bg-amber-500' },
  { name: 'Ensino', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { name: 'Grupo', color: 'bg-rose-500', dot: 'bg-rose-500' },
  { name: 'Outro', color: 'bg-slate-500', dot: 'bg-slate-500' },
]

export default function AgendaPage() {
  const { permissions } = usePermissions()
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<EventCategory | 'Todos'>('Todos')
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await agendaService.getEvents()
      setEvents(data)
    } catch (error) {
      toast.error('Erro ao carregar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    let filtered = events
    if (filter !== 'Todos') {
      filtered = filtered.filter((e) => e.category === filter)
    }
    // Filter by selected month for the list?
    // Usually people want to see upcoming events or events of the selected day.
    // Let's show upcoming events by default, but if a date is selected, maybe filter?
    // The user asked for "visualizar uma marcação na agenda dias que estão com evento".
    return filtered
  }, [events, filter])

  const eventsByDate = useMemo(() => {
    const map: Record<string, ChurchEvent[]> = {}
    events.forEach((event) => {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    })
    return map
  }, [events])

  const daysInMonth = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month')
    const endOfMonth = currentMonth.endOf('month')
    const days = []

    // Previous month padding
    const firstDayOfWeek = startOfMonth.day()
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    for (let i = 1; i <= endOfMonth.date(); i++) {
      days.push(startOfMonth.date(i))
    }

    return days
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth((prev) => prev.add(1, 'month'))
  const prevMonth = () => setCurrentMonth((prev) => prev.subtract(1, 'month'))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Agenda
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Eventos, cultos e programações da nossa igreja.
          </p>
        </div>
        {permissions.canManageAgenda && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white capitalize">
                {currentMonth.format('MMMM YYYY')}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="aspect-square" />

                const dateStr = day.format('YYYY-MM-DD')
                const hasEvents = eventsByDate[dateStr]?.length > 0
                const isSelected = selectedDate.isSame(day, 'day')
                const isToday = dayjs().isSame(day, 'day')

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl text-sm transition-all duration-200',
                      isSelected
                        ? 'bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30 scale-105 z-10'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
                      isToday &&
                        !isSelected &&
                        'border border-blue-500/50 text-blue-600 dark:text-blue-400',
                    )}
                  >
                    {day.date()}
                    {hasEvents && (
                      <div className="absolute bottom-1.5 flex gap-0.5">
                        {eventsByDate[dateStr].slice(0, 3).map((event, idx) => {
                          const category =
                            CATEGORIES.find((c) => c.name === event.category) || CATEGORIES[4]
                          return (
                            <div
                              key={event.id || idx}
                              className={cn(
                                'h-1 w-1 rounded-full',
                                isSelected ? 'bg-white' : category.dot,
                              )}
                            />
                          )
                        })}
                        {eventsByDate[dateStr].length > 3 && (
                          <div
                            className={cn(
                              'h-1 w-1 rounded-full bg-slate-400',
                              isSelected && 'bg-white/50',
                            )}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Filtros</h3>
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setFilter('Todos')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all',
                  filter === 'Todos'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Todos os Eventos
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setFilter(cat.name)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all',
                    filter === cat.name
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
                  )}
                >
                  <div className={cn('h-2 w-2 rounded-full', cat.dot)} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedDate.isSame(dayjs(), 'day')
                ? 'Atividades de Hoje'
                : `Atividades em ${selectedDate.format('DD/MM')}`}
            </h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {filteredEvents.filter((e) => e.date === selectedDate.format('YYYY-MM-DD')).length}{' '}
              eventos
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4" />
                <p>Carregando agenda...</p>
              </div>
            ) : filteredEvents.filter((e) => e.date === selectedDate.format('YYYY-MM-DD')).length >
              0 ? (
              filteredEvents
                .filter((e) => e.date === selectedDate.format('YYYY-MM-DD'))
                .map((event) => {
                  const category =
                    CATEGORIES.find((c) => c.name === event.category) || CATEGORIES[4]
                  return (
                    <div
                      key={event.id}
                      className="group flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center rounded-2xl px-4 py-3 text-white shadow-lg',
                          category.color,
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                          {dayjs(event.date).format('MMM')}
                        </span>
                        <span className="text-2xl font-black leading-none mt-1">
                          {dayjs(event.date).format('DD')}
                        </span>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase',
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                            )}
                          >
                            {event.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-5">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
                              <Clock className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{event.time}h</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
                              <MapPin className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{event.location}</span>
                          </div>
                        </div>
                      </div>

                      {permissions.canManageAgenda && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={async () => {
                              if (confirm('Deseja excluir este evento?')) {
                                try {
                                  await agendaService.deleteEvent(event.id)
                                  toast.success('Evento excluído')
                                  fetchEvents()
                                } catch (error) {
                                  toast.error('Erro ao excluir')
                                }
                              }
                            }}
                            className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                  <CalendarIcon className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Nenhum evento programado
                </h4>
                <p className="text-slate-500 max-w-xs mt-1">
                  Não há atividades registradas para este dia. Selecione outra data no calendário ou
                  adicione um novo evento.
                </p>
                {permissions.canManageAgenda && (
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    className="mt-6 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Adicionar Evento
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
      />
    </div>
  )
}

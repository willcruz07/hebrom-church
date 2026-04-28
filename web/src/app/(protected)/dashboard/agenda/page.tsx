'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const mockEvents = [
  {
    id: '1',
    title: 'Culto de Celebração',
    time: '19:30',
    location: 'Templo Principal',
    category: 'Culto',
    date: '2026-04-27',
  },
  {
    id: '2',
    title: 'Escola Bíblica',
    time: '09:00',
    location: 'Salas de Aula',
    category: 'Ensino',
    date: '2026-05-03',
  }
];

export default function AgendaPage() {
  const { permissions } = usePermissions();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-slate-500 dark:text-slate-400">Eventos, cultos e programações.</p>
        </div>
        {permissions.canManageAgenda && (
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95">
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Calendar Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Abril 2026</h3>
              <div className="flex gap-1">
                <button className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="py-2">{d}</div>)}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 27;
                return (
                  <div 
                    key={i} 
                    className={`flex aspect-square items-center justify-center rounded-lg text-sm transition-colors cursor-pointer ${
                      isToday ? 'bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Categorias</h3>
            <div className="space-y-3">
              {[
                { name: 'Cultos', color: 'bg-blue-500' },
                { name: 'Eventos', color: 'bg-amber-500' },
                { name: 'Ensino', color: 'bg-emerald-500' },
                { name: 'Grupos', color: 'bg-rose-500' },
              ].map(cat => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${cat.color}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Próximas Atividades</h3>
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <div 
                key={event.id}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 px-3 py-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-tighter">ABR</span>
                  <span className="text-xl font-black">{event.date.split('-')[2]}</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {event.category}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  </div>
                </div>
                
                {permissions.canManageAgenda && (
                  <button className="rounded-lg p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-all">
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client'

import { Clock, Calendar, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const SCHEDULES = [
  {
    day: 'Domingo',
    time: '09:20',
    title: 'Escola Bíblica Dominical',
    description: 'Ensino profundo da Palavra para todas as idades.',
    icon: Calendar,
  },
  {
    day: 'Domingo',
    time: '18:30',
    title: 'Culto de Celebração',
    description: 'Momento de adoração, comunhão e mensagem inspiradora.',
    icon: Users,
  },
  {
    day: 'Quinta-feira',
    time: '19:30',
    title: 'Culto de Oração e Doutrina',
    description: 'Fortalecimento espiritual através da oração e estudo.',
    icon: Clock,
  },
]

export function CultSchedule() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {SCHEDULES.map((item, index) => (
        <motion.div
          key={index}
          whileHover={{ y: -10 }}
          className="group relative overflow-hidden rounded-3xl bg-slate-900/40 p-8 border border-slate-800/50 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-slate-900/60"
        >
          {/* Accent decoration */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl transition-all group-hover:bg-amber-500/10" />
          
          <div className="mb-6 flex items-center justify-between">
            <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
              <item.icon size={32} />
            </div>
            <span className="text-4xl font-black text-slate-800 transition-colors group-hover:text-slate-700">
              {item.time}
            </span>
          </div>

          <h3 className="mb-2 text-2xl font-bold text-white group-hover:text-amber-500 transition-colors">
            {item.day}
          </h3>
          <h4 className="mb-4 text-lg font-medium text-slate-200">
            {item.title}
          </h4>
          <p className="text-slate-400 leading-relaxed">
            {item.description}
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Saiba mais</span>
            <div className="h-[2px] w-8 bg-amber-500" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

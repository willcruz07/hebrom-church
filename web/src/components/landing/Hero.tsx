'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ROUTES } from '@/paths'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'

export function Hero() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background with Overlay */}
      <div
        className="absolute inset-0 bg-[url('/church_hero.png')] bg-cover bg-center bg-no-repeat"
        style={{ filter: 'brightness(0.3) contrast(1.1)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-950 to-transparent opacity-60" />

      <div className="relative z-10 w-full max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-8 flex justify-center"
        >
          <Image
            width={500}
            height={500}
            src="/logo_sb.png"
            alt="Hebrom Church"
            className="h-auto w-2xl -mb-56 object-contain brightness-125 contrast-125 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Ano da <span className="text-amber-500">Edificação</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 text-slate-300 font-light italic">
              Sobre esta rocha edificarei a minha igreja
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 sm:text-xl lg:text-2xl leading-relaxed">
            Uma comunidade fundamentada na Palavra, vivendo em amor e crescendo para a glória de
            Deus.
          </p>

          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Link
              href={ROUTES.NO_AUTH.SIGN_IN}
              className="group relative flex items-center justify-center overflow-hidden rounded-full bg-amber-600 px-10 py-4 font-bold text-white transition-all hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] w-full sm:w-auto"
            >
              <span className="relative z-10">Acessar Plataforma</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Link>

            <Link
              href="#cultos"
              className="rounded-full border border-slate-700 bg-slate-900/40 backdrop-blur-md px-10 py-4 font-bold text-slate-200 transition-all hover:bg-slate-800 hover:border-slate-500 w-full sm:w-auto"
            >
              Ver Horários
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 flex flex-col items-center gap-2 text-slate-500 cursor-pointer"
        onClick={() => document.getElementById('cultos')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="text-xs uppercase tracking-widest font-medium">Role para explorar</span>
        <ChevronDown size={24} />
      </motion.div>
    </div>
  )
}

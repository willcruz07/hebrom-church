'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background ambient glow - Multi-layered */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[140px] animate-pulse" />
      <div className="absolute h-96 w-96 rounded-full bg-amber-600/5 blur-[100px] animate-pulse delay-700" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated Rings System */}
        <div className="relative flex items-center justify-center">
          {/* Main primary ring - Faster, thicker */}
          <motion.svg
            width="160"
            height="160"
            viewBox="0 0 100 100"
            className="absolute"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="60 180"
              strokeLinecap="round"
              className="text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            />
          </motion.svg>

          {/* Secondary ring - Slower, opposite direction */}
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 100 100"
            className="absolute"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="30 160"
              strokeLinecap="round"
              className="text-amber-500/30"
            />
          </motion.svg>

          {/* Outer ring - Very slow, thin */}
          <motion.svg
            width="240"
            height="240"
            viewBox="0 0 100 100"
            className="absolute"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="10 150"
              strokeLinecap="round"
              className="text-amber-500/10"
            />
          </motion.svg>

          {/* Logo Container with heartbeat & glow */}
          <motion.div
            animate={{ 
              scale: [0.95, 1.08, 0.95],
              opacity: [0.8, 1, 0.8],
              filter: [
                'drop-shadow(0 0 12px rgba(245,158,11,0.2))',
                'drop-shadow(0 0 30px rgba(245,158,11,0.6))',
                'drop-shadow(0 0 12px rgba(245,158,11,0.2))'
              ]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="relative z-10 flex h-28 w-28 items-center justify-center"
          >
            <Image
              src="/hearth.png"
              alt="Hebrom Loading"
              width={90}
              height={90}
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* Branding & Status */}
        <div className="mt-24 flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <span className="text-[13px] font-black uppercase tracking-[0.8em] text-white/95">
              Hebrom
            </span>
            <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.4em] text-amber-500/70">
              System
            </span>
          </motion.div>

          {/* Animated progress indicator */}
          <div className="flex gap-2 h-1 items-center">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                  backgroundColor: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,1)', 'rgba(245,158,11,0.3)']
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
                className="h-1 w-1 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modern footer accent */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], width: ['40px', '60px', '40px'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" 
        />
      </div>
    </div>
  )
}

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute h-96 w-96 rounded-full bg-amber-500/5 blur-[120px] animate-pulse" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative flex items-center justify-center">
          {/* Main rotating ring */}
          <motion.svg
            width="140"
            height="140"
            viewBox="0 0 100 100"
            className="absolute"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="40 180"
              strokeLinecap="round"
              className="text-amber-500/40"
            />
          </motion.svg>

          {/* Slower, opposite rotating ring */}
          <motion.svg
            width="170"
            height="170"
            viewBox="0 0 100 100"
            className="absolute"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="10 150"
              strokeLinecap="round"
              className="text-amber-500/20"
            />
          </motion.svg>

          {/* Logo Container with sophisticated pulse */}
          <motion.div
            animate={{ 
              scale: [0.95, 1.05, 0.95],
              opacity: [0.7, 1, 0.7],
              filter: [
                'drop-shadow(0 0 10px rgba(245,158,11,0.2))',
                'drop-shadow(0 0 25px rgba(245,158,11,0.5))',
                'drop-shadow(0 0 10px rgba(245,158,11,0.2))'
              ]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="relative z-10 flex h-24 w-24 items-center justify-center"
          >
            <Image
              src="/hearth.png"
              alt="Hebrom Loading"
              width={80}
              height={80}
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* Branding & Status */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            animate={{ opacity: 1, letterSpacing: '0.4em' }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-white/90">
              Hebrom
            </span>
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.3em] text-amber-500/60">
              System
            </span>
          </motion.div>

          {/* Animated dot indicator */}
          <div className="flex gap-1.5 h-1 items-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  backgroundColor: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,1)', 'rgba(245,158,11,0.3)']
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="h-1 w-1 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modern bottom accent */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-20">
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      </div>
    </div>
  )
}

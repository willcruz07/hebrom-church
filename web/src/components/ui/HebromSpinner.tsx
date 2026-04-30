'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HebromSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HebromSpinner({ size = 'md', className }: HebromSpinnerProps) {
  const dimensions = {
    sm: { container: 'h-8 w-8', image: 20, stroke: 2.5 },
    md: { container: 'h-12 w-12', image: 28, stroke: 2.5 },
    lg: { container: 'h-20 w-20', image: 48, stroke: 3 }
  }

  const { container, image, stroke } = dimensions[size]

  return (
    <div className={cn("relative flex items-center justify-center", container, className)}>
      {/* Outer Glow / Ambient */}
      <div className="absolute inset-0 rounded-full bg-amber-500/5 blur-sm animate-pulse" />

      {/* Main Rotating Ring */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray="65 175"
          strokeLinecap="round"
          className="text-amber-500"
        />
      </motion.svg>

      {/* Secondary Subtle Ring (Counter-rotating) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full opacity-30"
        animate={{ rotate: -360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke / 2}
          strokeDasharray="15 150"
          strokeLinecap="round"
          className="text-amber-500"
        />
      </motion.svg>
      
      {/* Central Logo with Heartbeat animation */}
      <motion.div
        animate={{ 
          scale: [0.9, 1.05, 0.9],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative z-10 drop-shadow-sm"
      >
        <Image
          src="/hearth.png"
          alt="Loading"
          width={image}
          height={image}
          className="object-contain"
        />
      </motion.div>
    </div>
  )
}

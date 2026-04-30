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
    sm: { container: 'h-6 w-6', image: 16, stroke: 2 },
    md: { container: 'h-10 w-10', image: 24, stroke: 2 },
    lg: { container: 'h-16 w-16', image: 40, stroke: 2 }
  }

  const { container, image, stroke } = dimensions[size]

  return (
    <div className={cn("relative flex items-center justify-center", container, className)}>
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray="60 180"
          strokeLinecap="round"
          className="text-amber-500"
        />
      </motion.svg>
      
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
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

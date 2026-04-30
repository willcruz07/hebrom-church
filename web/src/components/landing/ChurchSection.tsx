'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChurchSectionProps {
  children: ReactNode
  className?: string
  id?: string
  title?: string
  subtitle?: string
}

export function ChurchSection({ children, className, id, title, subtitle }: ChurchSectionProps) {
  return (
    <section id={id} className={cn('py-20 px-6 lg:py-32', className)}>
      <div className="mx-auto max-w-7xl">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-5xl md:text-6xl mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mx-auto max-w-2xl text-lg text-slate-400 sm:text-xl">
                {subtitle}
              </p>
            )}
            <div className="mt-6 flex justify-center">
              <div className="h-1 w-20 rounded-full bg-amber-500" />
            </div>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}

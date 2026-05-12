'use client'

import Image from 'next/image'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Simple Static Logo Container */}
        <div className="relative flex items-center justify-center w-32 h-32">
          <Image
            src="/hearth.png"
            alt="Hebrom Loading"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </div>

        {/* Branding & Status */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[13px] font-black uppercase tracking-[0.8em] text-white/95">
              Hebrom
            </span>
            <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.4em] text-amber-500/70">
              System
            </span>
          </div>

          {/* Simple Loading Text */}
          <div className="mt-4 text-[10px] font-medium uppercase tracking-widest text-amber-500/70">
            Carregando...
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Image from 'next/image'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Premium Spinner Logo Container */}
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Animated Spinner Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/10" />
          
          <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="2"
              strokeDasharray="60 200"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner Pulsing Glow */}
          <div className="absolute inset-4 rounded-full bg-amber-500/5 blur-xl animate-pulse" />

          {/* Logo with Heartbeat */}
          <div className="relative z-10 animate-heartbeat will-change-transform">
            <Image
              src="/hearth.png"
              alt="Hebrom Loading"
              width={80}
              height={80}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
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

'use client'

import { useAuth } from '@/store/useAuth'
import { User, MapPin, Shield, CreditCard, Phone, Calendar, Waves, Droplets } from 'lucide-react'
import dayjs from '@/lib/dayjs'
import { useEffect, useState } from 'react'
import { formatPhone, formatDate } from '@/lib/utils'
import Image from 'next/image'

/**
 * IdCardPage Component
 * Premium Church ID Card following the requested dark theme and layout.
 */
export default function IdCardPage() {
  const { currentUser } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Using requestAnimationFrame to avoid "cascading renders" linter warning
    const raf = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!mounted) return null

  const roleLabels: Record<string, string> = {
    visitor: 'Visitante',
    member: 'Membro Ativo Oficial',
    secretary: 'Secretaria',
    pastor: 'Pastor Presidente',
    pending_member: 'Membro em Observação',
  }

  const userRole = currentUser?.role || 'visitor'
  const displayRole = roleLabels[userRole]

  const registrationDate = currentUser?.created_at ? formatDate(currentUser.created_at) : '---'

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6 bg-slate-950/20">
      <div className="relative group perspective-1000 w-full max-w-[700px]">
        {/* Main Card Container - Horizontal Layout */}
        <div className="relative w-full aspect-[1.65/1] overflow-hidden rounded-[2.5rem] bg-[#080d17] text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] border border-white/10 flex transition-all duration-700 hover:scale-[1.01] hover:border-white/20">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-600/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Realistic Texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          {/* LEFT PANEL: Profile & Verification */}
          <div className="w-[38%] relative flex flex-col items-center justify-center p-8 border-r border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
            {/* ID Number Ribbon */}
            <div className="absolute top-8 left-0 px-4 py-1.5 bg-amber-600/20 border-y border-r border-amber-500/30 rounded-r-full backdrop-blur-sm">
              <span className="text-[10px] font-black tracking-[0.2em] text-amber-400">
                ID #{currentUser?.uid.slice(-8).toUpperCase() || '00000000'}
              </span>
            </div>

            {/* Avatar Section */}
            <div className="relative mt-4">
              {/* Animated Gradient Ring */}
              <div className="absolute inset-[-8px] rounded-full bg-gradient-to-tr from-amber-600 via-indigo-500 to-cyan-400 opacity-40 animate-pulse" />
              <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden bg-[#0a0f1a] border-[8px] border-[#080d17] shadow-2xl">
                {currentUser?.profile.avatar_url ? (
                  <img
                    src={currentUser.profile.avatar_url}
                    alt={currentUser.profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <User className="w-20 h-20 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-green-500 border-[4px] border-[#080d17] shadow-lg" />
            </div>

            {/* Role Badge */}
            <div className="mt-10 w-full px-4">
              <div className="py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md text-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                  {userRole === 'member'
                    ? 'Membro Efetivo'
                    : userRole === 'pastor'
                      ? 'Corpo Pastoral'
                      : displayRole}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Identity & Church Details */}
          <div className="w-[62%] p-10 flex flex-col">
            {/* Top Header: Recreated Premium Logo */}
            <div className="flex items-start justify-between mb-8">
              <Image
                src="/logo_sb.png"
                alt="Hebrom"
                width={256}
                height={256}
                className=" w-auto -mb-32 -mt-32"
              />
            </div>

            {/* Member Name */}
            <div className="mb-10">
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {currentUser?.profile.full_name || 'Nome do Membro'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="h-1 w-10 bg-amber-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  Membro Hebrom
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 flex-grow">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Cadastrado em
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100">{registrationDate}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-amber-500/70" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Data Batismo
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100">
                  {currentUser?.profile.baptism_date
                    ? formatDate(currentUser.profile.baptism_date)
                    : '---'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-500/70" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Contato
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100 tracking-wide">
                  {formatPhone(currentUser?.profile.phone)}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500/70" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Unidade
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100">Sede Principal</p>
              </div>
            </div>

            {/* Footer Address */}
            <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800/40 flex items-center justify-center border border-white/5 shrink-0">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 leading-tight truncate">
                  {currentUser?.profile.address || 'Endereço não informado'}
                </span>
              </div>

              {/* Authenticity Chip */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 shrink-0">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span className="text-[9px] font-black text-amber-400/80 tracking-tighter uppercase">
                  VERIFIED_MEMBER
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Glossy Reflection Overlay */}
        <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] overflow-hidden">
          <div className="absolute -inset-x-full top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent transform -skew-y-12 translate-y-[-20%] group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </div>

        {/* Float Shadow */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[85%] h-12 bg-amber-900/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-amber-600/10 transition-colors duration-500" />
      </div>
    </div>
  )
}

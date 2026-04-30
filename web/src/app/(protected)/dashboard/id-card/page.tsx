'use client'

import { useAuth } from '@/store/useAuth'
import {
  User,
  MapPin,
  Shield,
  CreditCard,
  Phone,
  Calendar,
  Waves,
  Droplets,
  ArrowLeft,
} from 'lucide-react'
import dayjs from '@/lib/dayjs'
import { useEffect, useState } from 'react'
import { formatPhone, formatDate, cn } from '@/lib/utils'
import Image from 'next/image'
import { useNavigation } from '@/hooks/useNavigation'

/**
 * IdCardPage Component
 * Premium Church ID Card following the requested dark theme and layout.
 */
export default function IdCardPage() {
  const { currentUser } = useAuth()
  const { navigateBack } = useNavigation()
  const [mounted, setMounted] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkOrientation = () => {
      const isMobile = window.innerWidth < 1024
      const isPortrait = window.innerHeight > window.innerWidth
      setIsLandscape(isMobile && isPortrait)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
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
    <div
      className={cn(
        'flex min-h-[calc(100vh-8rem)] items-center justify-center bg-slate-950/20 transition-all duration-500',
        isLandscape
          ? 'fixed inset-0 z-[100] h-screen w-screen bg-slate-950 p-0 overflow-hidden'
          : 'p-2 md:p-6',
      )}
    >
      {/* Navigation & Status Header (Only visible in Landscape/Mobile forced mode) */}
      {isLandscape && (
        <div className="absolute inset-x-0 top-0 z-[110] flex items-center justify-between p-6">
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Voltar</span>
          </button>

          <div className="flex flex-col items-end gap-1 opacity-80">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 backdrop-blur-md border border-amber-500/20">
              <Shield className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                Visualização Digital
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Wrapper */}
      <div
        className={cn(
          'relative transition-all duration-700 ease-out-expo',
          isLandscape
            ? 'h-[95vh] w-[158vw] rotate-90 flex items-center justify-center' // Using vw/vh logic for rotation fit
            : 'w-full max-w-[700px] perspective-1000',
        )}
      >
        {/* Main Card Container - Horizontal Layout */}
        <div
          className={cn(
            'relative w-full aspect-[1.65/1] overflow-hidden rounded-[2.5rem] bg-[#080d17] text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] border border-white/10 flex transition-all duration-700 hover:border-white/20',
            !isLandscape && 'hover:scale-[1]',
          )}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-600/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Realistic Texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          {/* LEFT PANEL: Profile & Verification */}
          <div className="w-[38%] relative flex flex-col items-center justify-center p-6 md:p-8 border-r border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
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
              <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden bg-[#0a0f1a] border-[6px] md:border-[8px] border-[#080d17] shadow-2xl">
                {currentUser?.profile.avatar_url ? (
                  <img
                    src={currentUser.profile.avatar_url}
                    alt={currentUser.profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <User className="w-16 h-16 md:w-20 md:h-20 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="absolute bottom-4 right-4 w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-500 border-[4px] border-[#080d17] shadow-lg" />
            </div>

            {/* Role Badge */}
            <div className="mt-8 md:mt-10 w-full px-2 md:px-4">
              <div className="py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md text-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-300">
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
          <div className="w-[62%] p-6 md:p-10 flex flex-col">
            {/* Top Header: Recreated Premium Logo */}
            <div className="flex items-start justify-between mb-6 md:mb-8">
              <Image
                src="/logo_sb.png"
                alt="Hebrom"
                width={256}
                height={256}
                className="w-auto -mb-28 -mt-28 md:-mb-32 md:-mt-32"
              />
            </div>

            {/* Member Name */}
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
                {currentUser?.profile.full_name || 'Nome do Membro'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="h-1 w-8 md:w-10 bg-amber-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em]">
                  Membro Hebrom
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-6 md:gap-y-8 flex-grow">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500/70" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Cadastrado em
                  </span>
                </div>
                <p className="text-sm md:text-base font-bold text-slate-100">{registrationDate}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Waves className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500/70" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Data Batismo
                  </span>
                </div>
                <p className="text-sm md:text-base font-bold text-slate-100">
                  {currentUser?.profile.baptism_date
                    ? formatDate(currentUser.profile.baptism_date)
                    : '---'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500/70" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Contato
                  </span>
                </div>
                <p className="text-sm md:text-base font-bold text-slate-100 tracking-wide">
                  {formatPhone(currentUser?.profile.phone)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500/70" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Unidade
                  </span>
                </div>
                <p className="text-sm md:text-base font-bold text-slate-100">Sede Principal</p>
              </div>
            </div>

            {/* Footer Address */}
            <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-800/40 flex items-center justify-center border border-white/5 shrink-0">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-slate-400 leading-tight truncate">
                  {currentUser?.profile.address || 'Endereço não informado'}
                </span>
              </div>

              {/* Authenticity Chip */}
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 shrink-0">
                <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                <span className="text-[8px] md:text-[9px] font-black text-amber-400/80 tracking-tighter uppercase">
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
      </div>

      {/* Manual Toggle for testing/accessibility (smaller, more discreet) */}
      {!isLandscape && (
        <button
          onClick={() => setIsLandscape(!isLandscape)}
          className="fixed bottom-6 right-6 z-[120] p-3 rounded-full bg-slate-900 border border-white/10 text-white/50 hover:text-amber-500 transition-colors lg:hidden"
        >
          <CreditCard className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

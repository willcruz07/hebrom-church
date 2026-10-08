'use client'

import { useAuth } from '@/store/useAuth'
import {
  User,
  MapPin,
  Shield,
  Phone,
  Calendar,
  Cake,
  Heart,
  Waves,
  ArrowLeft,
  Users,
  Check,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import type { AppUser, UserRole } from '@/types'
import { useEffect, useState } from 'react'
import { formatPhone, formatDate, cn } from '@/lib/utils'
import Image from 'next/image'
import { useNavigation } from '@/hooks/useNavigation'
import { MINISTRY_ATTRIBUTION_THEME, MINISTRY_LEADER_ACCENT } from '@/lib/ministry-attributions'

type ViewMode = 'inline' | 'fullscreen' | 'rotated'

const ROLE_LABELS: Record<UserRole, string> = {
  visitor: 'Visitante',
  member: 'Membro Efetivo',
  secretary: 'Secretaria',
  pastor: 'Corpo Pastoral',
  pending_member: 'Membro em Observação',
}

interface CardStatus {
  label: string
  subtitle: string
  color: string
  icon: LucideIcon
}

// Situação da carteirinha a partir do cadastro: `is_active` (desativado pela secretaria)
// tem precedência sobre o papel; só member/secretary/pastor ativos têm carteirinha ativa.
// Qualquer pendência (inativo ou aguardando aprovação) fica vermelha.
function getCardStatus(user: AppUser | null): CardStatus {
  if (!user || user.is_active === false) {
    return {
      label: 'Carteirinha inativa',
      subtitle: 'Cadastro inativo',
      color: '#EF4444',
      icon: AlertTriangle,
    }
  }
  if (user.role === 'pending_member') {
    return {
      label: 'Aguardando aprovação',
      subtitle: 'Membro em observação',
      color: '#EF4444',
      icon: AlertTriangle,
    }
  }
  if (user.role === 'visitor') {
    return { label: 'Visitante', subtitle: 'Visitante Hebrom', color: '#94A3B8', icon: User }
  }
  return {
    label: 'Carteirinha ativa',
    subtitle: `${user.atribuicao_principal ?? 'MEMBRO'} Hebrom`,
    color: '#22C55E',
    icon: Check,
  }
}

type MaritalStatus = NonNullable<AppUser['profile']['marital_status']>

const MARITAL_STATUS_STEMS: Record<MaritalStatus, string> = {
  single: 'Solteiro (a)',
  married: 'Casado (a)',
  divorced: 'Divorciado (a)',
  widowed: 'Viúvo (a)',
  separated: 'Separado (a)',
}

// Flexiona pelo gênero do cadastro; sem gênero informado usa "o(a)"
function formatMaritalStatus(status?: MaritalStatus, gender?: AppUser['profile']['gender']) {
  if (!status) return '-'
  const suffix = gender === 'M' ? 'o' : gender === 'F' ? 'a' : 'o(a)'
  return MARITAL_STATUS_STEMS[status] + suffix
}

// Abaixo do breakpoint `lg` a carteirinha ocupa a tela toda. Com o telefone em pé o
// cartão é girado 90° para aproveitar o comprimento da tela.
function getViewMode(): ViewMode {
  if (window.innerWidth >= 1024) return 'inline'
  return window.innerHeight > window.innerWidth ? 'rotated' : 'fullscreen'
}

/**
 * IdCardPage Component
 * Premium Church ID Card following the requested dark theme and layout.
 *
 * Todas as medidas internas do cartão usam `cqw` (1% da largura do cartão): o cartão
 * escala como um objeto físico, mantendo proporção de texto/espaçamento em qualquer
 * tela ou densidade. Os `clamp()` garantem um mínimo legível nos cartões menores.
 */
export default function IdCardPage() {
  const { currentUser } = useAuth()
  const { navigateBack } = useNavigation()
  const [viewMode, setViewMode] = useState<ViewMode | null>(null)

  useEffect(() => {
    const update = () => setViewMode(getViewMode())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (!viewMode) return null

  const isFullscreen = viewMode !== 'inline'
  const isRotated = viewMode === 'rotated'

  const userRole = currentUser?.role || 'visitor'
  const displayRole = ROLE_LABELS[userRole]
  const status = getCardStatus(currentUser)

  const attributionTheme = currentUser?.atribuicao_principal
    ? MINISTRY_ATTRIBUTION_THEME[currentUser.atribuicao_principal]
    : null

  // O cargo principal já aparece em destaque abaixo do nome; aqui entram só as
  // atribuições secundárias (cada uma é um grupo do mural — ver resolveAttributionGroupIds).
  const otherGroups = (currentUser?.atribuicoes_secundarias ?? []).filter(
    (g) => g !== currentUser?.atribuicao_principal,
  )
  const otherGroupsValue =
    otherGroups.length === 0
      ? '-'
      : otherGroups.length === 1
        ? otherGroups[0]
        : `${otherGroups[0]} +${otherGroups.length - 1}`

  // Para membros, a data de comunhão (lançada pela secretaria) é o "membro desde" real;
  // sem ela, cai na data do primeiro acesso.
  const communionDate = currentUser?.profile.communion_date
  const sinceItem = communionDate
    ? { label: 'Membro desde', value: formatDate(communionDate) }
    : { label: 'Cadastrado em', value: formatDate(currentUser?.created_at) }

  const profile = currentUser?.profile

  const infoItems: { icon: LucideIcon; label: string; value: string; title?: string }[] = [
    { icon: Cake, label: 'Nascimento', value: formatDate(profile?.birth_date) },
    {
      icon: Heart,
      label: 'Estado civil',
      value: formatMaritalStatus(profile?.marital_status, profile?.gender),
    },
    { icon: Calendar, ...sinceItem },
    { icon: Waves, label: 'Batismo', value: formatDate(profile?.baptism_date) },
    { icon: Phone, label: 'Telefone', value: formatPhone(profile?.phone) },
    {
      icon: Users,
      label: 'Atividade Principal',
      value: otherGroupsValue,
      title: otherGroups.join(', '),
    },
  ]

  const card = (
    <div className="@container relative w-full">
      {/* Main Card Container - Horizontal Layout */}
      <div className="relative flex aspect-[1.65/1] w-full overflow-hidden rounded-[4.5cqw] border border-white/10 bg-[#080d17] text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-amber-600/10 to-transparent" />
        <div className="pointer-events-none absolute -right-[12cqw] -bottom-[12cqw] size-[36cqw] rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -top-[12cqw] -left-[12cqw] size-[36cqw] rounded-full bg-indigo-500/10 blur-[100px]" />

        {/* Realistic Texture */}
        <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] mix-blend-overlay" />

        {/* LEFT PANEL: Profile & Verification */}
        <div className="relative flex w-[37%] flex-col items-center justify-center border-r border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent px-[3cqw] pt-[9cqw] pb-[4cqw]">
          {/* ID Number Ribbon */}
          <div className="absolute top-[4cqw] left-0 rounded-r-full border-y border-r border-amber-500/30 bg-amber-600/20 px-[2.5cqw] py-[0.8cqw] backdrop-blur-sm">
            <span className="text-[clamp(8px,1.6cqw,12px)] font-black tracking-[0.2em] text-amber-400">
              ID #{currentUser?.uid.slice(-8).toUpperCase() || '00000000'}
            </span>
          </div>

          {/* Avatar Section */}
          <div className="relative">
            {/* Animated Gradient Ring */}
            <div className="absolute -inset-[1.2cqw] animate-pulse rounded-full bg-gradient-to-tr from-amber-600 via-indigo-500 to-cyan-400 opacity-40" />
            <div className="relative size-[21cqw] overflow-hidden rounded-full border-[1.2cqw] border-[#080d17] bg-[#0a0f1a] shadow-2xl">
              {currentUser?.profile.avatar_url ? (
                <img
                  src={currentUser.profile.avatar_url}
                  alt={currentUser.profile.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-900">
                  <User className="size-[10cqw] text-slate-700" />
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div
              title={status.label}
              className="absolute right-[1.8cqw] bottom-[1.8cqw] size-[3.6cqw] rounded-full border-[0.7cqw] border-[#080d17]"
              style={{ backgroundColor: status.color, boxShadow: `0 0 10px ${status.color}99` }}
            />
          </div>

          {/* Role Badge */}
          <div className="mt-[4.5cqw] w-full">
            <div className="rounded-[1.8cqw] border border-amber-500/30 bg-amber-500/10 px-[1cqw] py-[1.2cqw] text-center backdrop-blur-md">
              <span className="block truncate text-[clamp(8px,1.55cqw,12px)] font-black tracking-[0.22em] text-amber-300 uppercase">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Identity & Church Details */}
        <div className="flex w-[63%] min-w-0 flex-col px-[5cqw] pt-[3.5cqw] pb-[3cqw]">
          {/* Top Header: logo recortado (o PNG tem muita margem transparente em volta) + selo de situação */}
          <div className="flex shrink-0 items-start justify-between">
            <div className="relative aspect-[690/285] w-[19cqw] overflow-hidden">
              <Image
                src="/logo_sb.png"
                alt="Hebrom"
                width={1024}
                height={1024}
                loading="eager"
                className="absolute top-[-114%] left-[-24.6%] w-[148.4%] max-w-none"
              />
            </div>

            <div
              role="img"
              aria-label={status.label}
              title={status.label}
              className="flex size-[4.6cqw] min-h-5 min-w-5 items-center justify-center rounded-full border"
              style={{
                color: status.color,
                borderColor: `${status.color}66`,
                backgroundColor: `${status.color}1F`,
                boxShadow: `0 0 14px ${status.color}55`,
              }}
            >
              <status.icon className="size-[55%]" strokeWidth={3} />
            </div>
          </div>

          {/* Member Name + cargo principal (com a cor do ministério) */}
          <div className="mt-[2.5cqw]">
            <h1 className="line-clamp-2 text-[clamp(15px,4.6cqw,36px)] leading-[1.1] font-black tracking-tight text-balance text-white drop-shadow-md">
              {profile?.full_name || 'Nome do Membro'}
            </h1>
            <div className="mt-[1.4cqw] flex min-w-0 items-center gap-[1.6cqw]">
              <div
                className="h-[0.5cqw] min-h-0.5 w-[6cqw] shrink-0 rounded-full"
                style={{ backgroundColor: attributionTheme?.bg ?? '#D97706' }}
              />
              {attributionTheme?.isLeader && (
                <span
                  className="size-[1cqw] min-h-1.5 min-w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: MINISTRY_LEADER_ACCENT,
                    boxShadow: `0 0 6px ${MINISTRY_LEADER_ACCENT}`,
                  }}
                />
              )}
              <span
                className="truncate text-[clamp(7px,1.45cqw,11px)] font-black tracking-[0.3em] uppercase"
                style={{ color: attributionTheme?.bg ?? '#94A3B8' }}
              >
                {currentUser?.atribuicao_principal ?? status.subtitle}
              </span>
            </div>
          </div>

          {/* Information Grid */}
          <dl className="mt-auto grid grid-cols-2 gap-x-[4cqw] gap-y-[2cqw] pb-[2cqw]">
            {infoItems.map(({ icon: Icon, label, value, title }) => (
              <div key={label} className="min-w-0 space-y-[0.6cqw]">
                <dt className="flex items-center gap-[1cqw]">
                  <Icon className="size-[clamp(10px,1.9cqw,14px)] shrink-0 text-amber-500/70" />
                  <span className="truncate text-[clamp(7px,1.35cqw,10px)] font-black tracking-widest text-slate-500 uppercase">
                    {label}
                  </span>
                </dt>
                <dd
                  title={title}
                  className="truncate text-[clamp(10px,2.5cqw,18px)] font-bold tracking-wide text-slate-100"
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Footer Address */}
          <div className="flex min-w-0 items-center gap-[1.6cqw] border-t border-white/5 pt-[1.6cqw]">
            <div className="flex size-[4.2cqw] shrink-0 items-center justify-center rounded-[1.2cqw] border border-white/5 bg-slate-800/40">
              <MapPin className="size-[2.1cqw] text-red-500" />
            </div>
            <span className="truncate text-[clamp(8px,1.7cqw,12px)] leading-tight font-bold text-slate-400">
              {profile?.address || 'Endereço não informado'}
            </span>
          </div>
        </div>
      </div>

      {/* Glossy Reflection Overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4.5cqw]">
        <div className="absolute -inset-x-full top-0 h-1/2 -translate-y-[20%] -skew-y-12 bg-gradient-to-b from-white/[0.06] to-transparent" />
      </div>
    </div>
  )

  if (!isFullscreen) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
        <div className="w-full max-w-[760px]">{card}</div>
      </div>
    )
  }

  return (
    // Sobe por cima do MobileLayout e respeita as safe areas (status bar, notch, home indicator)
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-slate-950 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {/* Barra discreta logo abaixo da status bar */}
      <div className="flex shrink-0 items-center justify-between px-4 pt-2 pb-1">
        <button
          onClick={navigateBack}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1.5 pr-3 pl-2 text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">Voltar</span>
        </button>

        <div className="flex items-center gap-1.5 text-white/40">
          <Shield className="size-3 text-amber-500/70" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Visualização Digital
          </span>
        </div>
      </div>

      {/* Área do cartão: o cartão ocupa o maior tamanho que caiba mantendo 1.65:1 */}
      <div className="relative min-h-0 flex-1 [container-type:size]">
        <div
          className={cn(
            'absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center p-3 [container-type:size]',
            // Girado: a largura do palco é a altura disponível (e vice-versa)
            isRotated ? 'h-[100cqw] w-[100cqh] rotate-90' : 'h-full w-full',
          )}
        >
          <div className="w-[min(100cqw,100cqh*1.65)]">{card}</div>
        </div>
      </div>
    </div>
  )
}

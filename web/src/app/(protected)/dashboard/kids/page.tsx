'use client'

import { useEffect, useState } from 'react'
import { Baby, QrCode, Users } from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { PageTitle } from '@/components/ui/page-title'
import { useNow } from '@/hooks/useNow'
import { isSessionStale } from '@/lib/kids/session'
import { isKidsTeamMember } from '@/lib/kids/team'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuth'
import { useKidsSession } from '@/store/useKidsSession'
import { KidsStatusCard } from './components/KidsStatusCard'
import { MyChildrenStatus } from './components/MyChildrenStatus'
import { MyQrCard } from './components/MyQrCard'
import { RoomPanel } from './components/RoomPanel'

type Tab = 'qr' | 'room'

const TABS: { id: Tab; label: string; icon: typeof QrCode }[] = [
  { id: 'qr', label: 'Meu QR', icon: QrCode },
  { id: 'room', label: 'Sala', icon: Users },
]

export default function KidsPage() {
  const { currentUser } = useAuth()
  const session = useKidsSession((s) => s.session)
  const loaded = useKidsSession((s) => s.loaded)
  const startListening = useKidsSession((s) => s.startListening)
  const now = useNow()
  const [tab, setTab] = useState<Tab>('qr')

  useEffect(() => {
    startListening()
  }, [startListening])

  const isTeam = isKidsTeamMember(currentUser)
  const stale = !!session && now > 0 && isSessionStale(session.opened_at.toMillis(), now)
  const activeSession = session && !stale ? session : null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageTitle
        title="Kids"
        icon={<Baby className="h-6 w-6 shrink-0 text-amber-600 md:h-8 md:w-8" />}
        description="Área Kids da Hebrom."
      />

      {!loaded ? (
        <div className="flex justify-center py-6">
          <HebromSpinner size="md" />
        </div>
      ) : (
        <KidsStatusCard session={activeSession} />
      )}

      {isTeam && (
        <nav
          aria-label="Seção Kids"
          className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800 md:w-[440px]"
        >
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all md:h-12 md:text-base',
                  tab === t.id
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
                {t.label}
              </button>
            )
          })}
        </nav>
      )}

      {isTeam && tab === 'room' ? (
        <RoomPanel session={session} stale={stale} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <MyQrCard />
          <MyChildrenStatus session={activeSession} />
        </div>
      )}
    </div>
  )
}

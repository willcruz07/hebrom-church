'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import dayjs from '@/lib/dayjs'
import { statusRows } from '@/lib/kids/checkin'
import { passLabel } from '@/lib/kids/session'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/paths'
import { subscribeToMyChildrenPasses } from '@/services/firebase/kids-room'
import { useAuth } from '@/store/useAuth'
import { useMyChildren } from '@/store/useMyChildren'
import type { KidPass, KidSession } from '@/types'

const formatTime = (ms: number) => dayjs(ms).format('HH:mm')

/** Filhos do usuário com o status do culto, em tempo real. `session` já vem sem sessão "velha". */
export function MyChildrenStatus({ session }: { session: KidSession | null }) {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid ?? ''
  const isVisitor = currentUser?.role === 'visitor'
  const { children, load, refresh } = useMyChildren()
  const sessionId = session?.id ?? null
  const [state, setState] = useState<{ sessionId: string | null; passes: KidPass[] }>({ sessionId: null, passes: [] })

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  useEffect(() => {
    if (!sessionId || !uid) return
    return subscribeToMyChildrenPasses(
      sessionId,
      uid,
      (passes) => setState({ sessionId, passes }),
      (error) => console.error(error),
    )
  }, [sessionId, uid])

  const passes = state.sessionId === sessionId ? state.passes : []
  const rows = statusRows(children, passes)

  // Criança cadastrada pela equipe na entrada: relê a lista para ela aparecer também no perfil
  const unknownKey = passes
    .filter((p) => !children.some((c) => c.id === p.child_id))
    .map((p) => p.child_id)
    .sort()
    .join(',')
  useEffect(() => {
    if (unknownKey) refresh()
  }, [unknownKey, refresh])

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Meus filhos</h2>
        {children.length > 0 && (
          <Link href={ROUTES.AUTHENTICATED.PROFILE} className="text-xs font-bold text-amber-700 hover:underline dark:text-amber-400">
            Editar cadastros
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="space-y-3 text-sm text-slate-500">
          <p>Cadastre seus filhos no perfil para agilizar a entrada.</p>
          {isVisitor && <p>Se for a primeira vez, a equipe pode cadastrar a criança na hora.</p>}
          <Button asChild className="h-11 rounded-xl bg-amber-600 px-6 font-bold text-white hover:bg-amber-700">
            <Link href={ROUTES.AUTHENTICATED.PROFILE}>Ir para o perfil</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const pass = row.pass
            const label = passLabel(pass, uid, formatTime)
            return (
              <li key={row.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <UserAvatar src={row.photo_url} name={row.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-white">{row.name}</p>
                  <p
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      pass?.status === 'in' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-500',
                    )}
                  >
                    {pass?.status === 'in' && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                    {pass?.status === 'out' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                    {label}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

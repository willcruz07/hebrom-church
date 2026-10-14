'use client'

import Link from 'next/link'
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatAge } from '@/lib/kids/age'
import { entriesOf } from '@/lib/kids/health'
import { roomLabelOf } from '@/lib/kids/rooms'
import { formatPhone, whatsappUrl } from '@/lib/utils'
import { ROUTES } from '@/paths'
import type { AppUser, KidChild } from '@/types'
import { kidsToday } from './kids-today'

interface KidDetailModalProps {
  /** Mantida pelo pai durante o fechamento, para o conteúdo não sumir na animação. */
  child: KidChild | null
  open: boolean
  onOpenChange: (open: boolean) => void
  guardianOf: (uid: string) => AppUser | undefined
  /** Enquanto a lista de membros carrega, não dá para afirmar que um responsável foi removido. */
  guardiansLoaded: boolean
}

/** Ficha da criança em modo leitura (secretaria/pastor). */
export function KidDetailModal({ child, open, onOpenChange, guardianOf, guardiansLoaded }: KidDetailModalProps) {
  const today = kidsToday()
  const entries = child ? entriesOf(child.health) : []
  const alerts = entries.filter((e) => e.alert)
  const others = entries.filter((e) => !e.alert)
  const describe = (e: (typeof entries)[number]) => (e.detail ? `${e.label}: ${e.detail}` : e.label)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <UserAvatar src={child?.photo_url} name={child?.name} size={64} />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-black md:text-xl">{child?.name ?? ''}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                {child ? `${formatAge(child.birth_date, today)} · ${roomLabelOf(child.birth_date, today)}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {child && (
          <div className="space-y-5">
            {alerts.length > 0 && (
              <div className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/15">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> Alertas
                </p>
                {alerts.map((e) => (
                  <p key={e.id} className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {describe(e)}
                  </p>
                ))}
              </div>
            )}

            <Section title="Cuidados e restrições">
              {others.length ? (
                <div className="flex flex-wrap gap-2">
                  {others.map((e) => (
                    <span
                      key={e.id}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    >
                      {describe(e)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nenhum item marcado.</p>
              )}
            </Section>

            {child.notes && (
              <Section title="Observações">
                <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{child.notes}</p>
              </Section>
            )}

            <Section title="Autorizações">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {child.photo_consent ? 'Pode ser fotografada para as redes da igreja.' : 'Não autorizada a ser fotografada.'}
              </p>
            </Section>

            <Section title="Responsáveis">
              <ul className="space-y-2">
                {child.guardian_uids.map((uid) => {
                  const guardian = guardianOf(uid)
                  if (!guardian) {
                    return (
                      <li key={uid} className="text-sm text-slate-400">
                        {guardiansLoaded ? 'Responsável removido' : '…'}
                      </li>
                    )
                  }
                  const phone = guardian.profile.phone
                  const whatsapp = whatsappUrl(phone)
                  return (
                    <li
                      key={uid}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-800"
                    >
                      <UserAvatar src={guardian.profile.avatar_url} name={guardian.profile.full_name} size={40} />
                      <Link
                        href={`${ROUTES.AUTHENTICATED.MEMBERS}/${uid}`}
                        onClick={() => onOpenChange(false)}
                        className="min-w-0 flex-1"
                      >
                        <span className="block truncate text-sm font-bold text-slate-900 hover:text-amber-700 dark:text-white">
                          {guardian.profile.full_name}
                        </span>
                        <span className="block text-xs text-slate-500">{formatPhone(phone)}</span>
                      </Link>
                      {phone && (
                        <a
                          href={`tel:${phone.replace(/\D/g, '')}`}
                          aria-label="Ligar"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="WhatsApp"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  )
}

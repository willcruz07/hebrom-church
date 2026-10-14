'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { MAX_GUARDIANS } from '@/lib/kids/validate'
import { findUserByEmail, getGuardians, type GuardianInfo } from '@/services/firebase/kids'

interface GuardiansFieldProps {
  currentUid: string
  guardianUids: string[]
  /** Na criação o usuário não pode se remover (a regra exige que ele seja responsável). */
  canRemoveSelf: boolean
  onChange: (uids: string[]) => void
  error?: string
}

/** Responsáveis da criança: o usuário logado e outros vinculados pelo e-mail da conta. */
export function GuardiansField({ currentUid, guardianUids, canRemoveSelf, onChange, error }: GuardiansFieldProps) {
  const [info, setInfo] = useState<Record<string, GuardianInfo | null>>({})
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [candidate, setCandidate] = useState<GuardianInfo | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const missing = guardianUids.filter((uid) => !(uid in info))
    if (!missing.length) return
    let cancelled = false
    getGuardians(missing).then((found) => {
      if (!cancelled) setInfo((current) => ({ ...current, ...found }))
    })
    return () => {
      cancelled = true
    }
  }, [guardianUids, info])

  const resetAdd = () => {
    setAdding(false)
    setEmail('')
    setCandidate(null)
    setMessage('')
  }

  const search = async () => {
    setMessage('')
    setCandidate(null)
    if (!email.trim()) return
    setSearching(true)
    try {
      const user = await findUserByEmail(email)
      if (!user) setMessage('Nenhuma conta com este e-mail. Peça para a pessoa criar a conta no app primeiro.')
      else if (guardianUids.includes(user.uid)) setMessage('Esta pessoa já é responsável.')
      else setCandidate(user)
    } catch (err) {
      console.error(err)
      setMessage('Não foi possível buscar agora. Verifique sua conexão.')
    } finally {
      setSearching(false)
    }
  }

  const confirmCandidate = () => {
    if (!candidate) return
    setInfo((current) => ({ ...current, [candidate.uid]: candidate }))
    onChange([...guardianUids, candidate.uid])
    resetAdd()
  }

  // O usuário logado sempre primeiro
  const ordered = [...guardianUids].sort((a, b) => Number(b === currentUid) - Number(a === currentUid))
  const full = guardianUids.length >= MAX_GUARDIANS

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {ordered.map((uid) => {
          const guardian = info[uid]
          const canRemove = uid !== currentUid || (canRemoveSelf && guardianUids.length > 1)
          return (
            <li
              key={uid}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 pr-1 dark:border-slate-800"
            >
              <UserAvatar src={guardian?.avatar_url} name={guardian?.name} size={36} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {guardian === undefined ? '…' : guardian === null ? 'Responsável removido' : guardian.name}
                {uid === currentUid && <span className="ml-1 font-normal text-slate-400">(você)</span>}
              </span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onChange(guardianUids.filter((u) => u !== uid))}
                  aria-label="Remover responsável"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {adding ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-900/10">
          <div className="flex gap-2">
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  search()
                }
              }}
              placeholder="E-mail da conta do responsável"
              className="rounded-xl bg-white dark:bg-slate-900"
            />
            <Button
              type="button"
              onClick={search}
              disabled={searching || !email.trim()}
              aria-label="Buscar"
              className="h-11 w-11 shrink-0 rounded-xl bg-amber-600 p-0 text-white hover:bg-amber-700"
            >
              {searching ? <HebromSpinner size="sm" className="brightness-200" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {message && <p className="text-xs font-medium text-red-500">{message}</p>}
          {candidate && (
            <div className="flex items-center gap-3 rounded-xl bg-white p-2 dark:bg-slate-900">
              <UserAvatar src={candidate.avatar_url} name={candidate.name} size={36} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{candidate.name}</span>
              <Button
                type="button"
                onClick={confirmCandidate}
                className="h-9 rounded-lg bg-amber-600 px-4 font-bold text-white hover:bg-amber-700"
              >
                Confirmar
              </Button>
            </div>
          )}
          <Button type="button" variant="ghost" onClick={resetAdd} className="h-9 w-full rounded-lg text-slate-500">
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          disabled={full}
          onClick={() => setAdding(true)}
          className="h-10 w-full justify-start gap-2 rounded-xl font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
        >
          <Plus className="h-4 w-4" />
          Adicionar responsável
        </Button>
      )}
      {full && <p className="text-xs text-slate-400">Máximo de 4 responsáveis.</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

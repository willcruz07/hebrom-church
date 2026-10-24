'use client'

import { useEffect, useState } from 'react'
import { getGuardians, type GuardianInfo } from '@/services/firebase/kids'

// Cache por sessão do app: cada responsável é lido no máximo uma vez
const cache = new Map<string, GuardianInfo | null>()

/** Nome, foto e telefone dos responsáveis. `undefined` = carregando; `null` = conta não existe. */
export function useGuardianInfos(uids: string[]): Record<string, GuardianInfo | null | undefined> {
  const key = [...new Set(uids)].sort().join(',')
  const [, setVersion] = useState(0)

  useEffect(() => {
    const missing = key ? key.split(',').filter((uid) => !cache.has(uid)) : []
    if (!missing.length) return
    let cancelled = false
    getGuardians(missing).then((found) => {
      // Falha de rede (undefined) não entra no cache: a próxima abertura tenta de novo
      let changed = false
      for (const [uid, info] of Object.entries(found)) {
        if (info === undefined) continue
        cache.set(uid, info)
        changed = true
      }
      if (changed && !cancelled) setVersion((v) => v + 1)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return Object.fromEntries(uids.map((uid) => [uid, cache.get(uid)]))
}

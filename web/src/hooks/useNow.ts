'use client'

import { useEffect, useState } from 'react'

/** Hora atual em ms, atualizada a cada `intervalMs`. Vale 0 até montar (evita `Date.now()` no render). */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(0)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [intervalMs])

  return now
}

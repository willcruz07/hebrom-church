'use client'

import { useEffect, useState } from 'react'

/** Distância do topo/fim da página em que a barra sempre aparece. */
const EDGE = 80
/** Rolagem mínima para mudar de estado (evita piscar com tremidas do dedo). */
const THRESHOLD = 8

/** `true` enquanto o usuário rola para baixo; volta a `false` ao rolar para cima, no topo ou no fim. */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (y < EDGE || y > max - EDGE) setHidden(false)
      else if (y - last > THRESHOLD) setHidden(true)
      else if (last - y > THRESHOLD) setHidden(false)
      else return
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return hidden
}

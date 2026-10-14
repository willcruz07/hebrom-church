'use client'

import { useEffect, useState } from 'react'

/** Distância do fim da página em que a barra volta a aparecer. */
const EDGE = 80
/** Rolagem mínima para mudar de estado (evita piscar com tremidas do dedo). */
const THRESHOLD = 8

/**
 * Para telas de leitura: começa `true` (barra escondida ao entrar), continua `true`
 * enquanto o usuário rola para baixo e vira `false` ao rolar para cima ou chegar ao fim.
 * Mudar `resetKey` (ex.: outro capítulo) volta a esconder.
 */
export function useHideOnScroll(resetKey: string): boolean {
  const [hidden, setHidden] = useState(true)
  const [key, setKey] = useState(resetKey)
  if (key !== resetKey) {
    setKey(resetKey)
    setHidden(true)
  }

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      // Salto (ir ao topo ao trocar de capítulo, âncora ?v=) não é gesto do usuário
      if (Math.abs(y - last) > window.innerHeight) {
        last = y
        return
      }
      // Só conta como "fim" se a página rola de fato (não durante o carregamento)
      if (max > EDGE && y > max - EDGE) setHidden(false)
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

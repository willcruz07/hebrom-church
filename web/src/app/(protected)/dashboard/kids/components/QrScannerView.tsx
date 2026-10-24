'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CameraOff } from 'lucide-react'

interface QrScannerViewProps {
  /** Chamado uma vez por leitura; para ler de novo, o pai remonta o componente (`key`). */
  onResult: (text: string) => void
  /** Conteúdo abaixo da câmera (ex.: "Buscar pelo nome"). */
  footer?: ReactNode
}

/** Câmera traseira lendo QR (qr-scanner: funciona no Safari/iOS, inclusive PWA). */
export function QrScannerView({ onResult, footer }: QrScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onResultRef = useRef(onResult)
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let handled = false
    let scanner: { start(): Promise<void>; stop(): void; destroy(): void } | null = null

    import('qr-scanner')
      .then(({ default: QrScanner }) => {
        if (cancelled) return
        const instance = new QrScanner(
          video,
          (result) => {
            if (handled) return
            handled = true
            instance.stop()
            onResultRef.current(result.data)
          },
          { preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true },
        )
        scanner = instance
        return instance.start()
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setCameraError(true)
      })

    return () => {
      cancelled = true
      scanner?.destroy()
    }
  }, [])

  return (
    <div className="space-y-3">
      {cameraError ? (
        <div className="space-y-2 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
          <CameraOff className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Não foi possível usar a câmera.</p>
          <p className="text-xs text-slate-500">
            Libere o acesso à câmera para este app nas configurações do navegador (no iPhone: Ajustes → Safari → Câmera) e
            tente de novo, ou busque a criança pelo nome.
          </p>
        </div>
      ) : (
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        </div>
      )}
      {footer}
    </div>
  )
}

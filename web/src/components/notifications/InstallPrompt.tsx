'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone() {
  // Chrome/Edge/Firefox
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  // iOS Safari
  const navigatorStandalone = (navigator as any).standalone === true
  return displayModeStandalone || navigatorStandalone
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    function onAppInstalled() {
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    if (!isStandalone()) {
      window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.addEventListener('appinstalled', onAppInstalled)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  if (!isVisible || isStandalone()) return null

  const handleInstall = async () => {
    try {
      if (!deferredPrompt) return
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsVisible(false)
      } else {
        // keep banner available in case user wants to try again later
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.error('Install prompt error:', err)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return null

  // return (
  //   <div className="fixed right-0 bottom-4 left-0 z-50 flex justify-center">
  //     <div className="bg-background mx-4 flex w-full max-w-xl items-center justify-between gap-3 border p-3 shadow-lg">
  //       <div className="text-sm">
  //         <p className="font-medium">Instale o Hebrom Sys</p>
  //         <p className="text-muted-foreground">Tenha acesso rápido com experiência de app.</p>
  //       </div>
  //       <div className="flex gap-2">
  //         <Button variant="outline" size="sm" onClick={handleDismiss}>
  //           Agora não
  //         </Button>
  //         <Button size="sm" onClick={handleInstall}>
  //           Instalar
  //         </Button>
  //       </div>
  //     </div>
  //   </div>
  // );
}

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/useAuth'
import { requestNotificationPermission } from '@/services/firebase/messaging'

const DISMISS_KEY = 'hebromsys_notification_prompt_dismissed_at'
const DISMISS_DAYS = 7

function wasDismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {}
}

export default function NotificationPrompt() {
  const { currentUser } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if (
      currentUser &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default' &&
      !wasDismissedRecently()
    ) {
      setIsVisible(true)
    }
  }, [currentUser])

  if (!isVisible || !currentUser) return null

  // Sem nenhum `await` antes de requestNotificationPermission: o iOS exige que o pedido
  // de permissão aconteça dentro do gesto do clique.
  const handleEnable = async () => {
    setIsRequesting(true)
    const result = await requestNotificationPermission(currentUser.uid)
    setIsRequesting(false)

    switch (result) {
      case 'granted':
        toast.success('Notificações ativadas!')
        setIsVisible(false)
        break
      case 'denied':
        toast.error('Notificações bloqueadas. Ative em Ajustes > Notificações > Hebrom Sys.')
        setIsVisible(false)
        break
      case 'default':
        // Fechou o diálogo do sistema sem escolher
        rememberDismiss()
        setIsVisible(false)
        break
      case 'unsupported':
        toast.error('Este navegador não suporta notificações. No iPhone, abra pelo app instalado na tela de início.')
        rememberDismiss()
        setIsVisible(false)
        break
      default:
        toast.error('Não foi possível ativar as notificações. Tente novamente.')
    }
  }

  const handleDismiss = () => {
    rememberDismiss()
    setIsVisible(false)
  }

  return (
    // No mobile fica acima da bottom nav (80px) e da home indicator do iOS
    <div className="fixed right-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] left-0 z-50 flex justify-center lg:bottom-4">
      <div className="bg-background mx-4 flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border p-3 shadow-lg">
        <div className="text-sm">
          <p className="font-medium">Ativar notificações</p>
          <p className="text-muted-foreground">Receba avisos do mural, agenda e palavra do dia.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDismiss} disabled={isRequesting}>
            Agora não
          </Button>
          <Button size="sm" onClick={handleEnable} disabled={isRequesting}>
            {isRequesting ? 'Ativando…' : 'Ativar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

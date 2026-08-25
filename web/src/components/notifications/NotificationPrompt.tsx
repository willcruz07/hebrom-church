'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/useAuth'
import { requestNotificationPermission } from '@/services/firebase/messaging'

export default function NotificationPrompt() {
  const { currentUser } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (currentUser && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setIsVisible(true)
    }
  }, [currentUser])

  if (!isVisible || !currentUser) return null

  const handleEnable = async () => {
    await requestNotificationPermission(currentUser.uid)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <div className="fixed right-0 bottom-4 left-0 z-50 flex justify-center">
      <div className="bg-background mx-4 flex w-full max-w-xl items-center justify-between gap-3 border p-3 shadow-lg">
        <div className="text-sm">
          <p className="font-medium">Ativar notificações</p>
          <p className="text-muted-foreground">Receba avisos do mural, agenda e palavra do dia.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Agora não
          </Button>
          <Button size="sm" onClick={handleEnable}>
            Ativar
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { useMessages } from '@/hooks/useMessages'
import { buildQrPayload } from '@/lib/kids/qr'
import { getOrCreateQrToken, regenerateQrToken } from '@/services/firebase/kids-room'
import { useAuth } from '@/store/useAuth'

export function MyQrCard() {
  const { currentUser } = useAuth()
  const { confirm } = useMessages()
  const uid = currentUser?.uid
  const [token, setToken] = useState<{ uid: string; value: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    getOrCreateQrToken(uid)
      .then((value) => {
        if (!cancelled) setToken({ uid, value })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  const renew = async () => {
    if (!uid) return
    const confirmed = await confirm({
      title: 'Gerar novo QR',
      description: 'O QR atual deixará de funcionar.',
      confirmText: 'Gerar novo',
    })
    if (!confirmed) return
    setRenewing(true)
    try {
      setToken({ uid, value: await regenerateQrToken(uid) })
      toast.success('Novo QR gerado')
    } catch (error) {
      console.error(error)
      toast.error('Sem conexão. Tente de novo.')
    } finally {
      setRenewing(false)
    }
  }

  const current = token && token.uid === uid ? token.value : null

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Meu QR</h2>
      <div className="mx-auto flex h-[264px] w-[264px] items-center justify-center rounded-2xl bg-white p-4 shadow-inner ring-1 ring-slate-200">
        {current && uid ? (
          <QRCodeSVG value={buildQrPayload(uid, current)} size={232} level="M" marginSize={0} />
        ) : failed ? (
          <p className="text-sm text-slate-500">Não foi possível carregar o QR. Verifique sua conexão.</p>
        ) : (
          <HebromSpinner size="lg" />
        )}
      </div>
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{currentUser?.profile.full_name}</p>
        <p className="text-sm text-slate-500">Mostre este código para a equipe da Área Kids.</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={renew}
        disabled={!current || renewing}
        className="h-10 gap-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <RefreshCw className="h-4 w-4" /> Gerar novo QR
      </Button>
    </section>
  )
}

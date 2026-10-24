'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ROUTES } from '@/paths'

/** QR com o endereço do app, para o adulto sem conta criar a dele na hora. */
export function SignupQrDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}${ROUTES.NO_AUTH.SIGN_IN}` : ''
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">Criar conta no app</DialogTitle>
          <DialogDescription>
            Peça para o responsável ler este QR com a câmera do celular, criar a conta e abrir Kids → Meu QR.
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          {url && <QRCodeSVG value={url} size={220} level="M" marginSize={0} />}
        </div>
        <p className="text-center text-xs text-slate-500">{url}</p>
      </DialogContent>
    </Dialog>
  )
}

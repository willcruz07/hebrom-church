'use client'

import Image from 'next/image'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface AvatarLightboxProps {
  src?: string | null
  name?: string | null
  className?: string
  textClassName?: string
}

/** Avatar clicável que abre a foto ampliada sobre um fundo desfocado. Sem foto, vira um avatar comum. */
export function AvatarLightbox({ src, name, className, textClassName }: AvatarLightboxProps) {
  const avatar = <UserAvatar src={src} name={name} className={className} textClassName={textClassName} />
  if (!src) return avatar

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        className="cursor-zoom-in rounded-3xl transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label={`Ampliar foto de ${name ?? 'membro'}`}
      >
        {avatar}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-md" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none">
          <DialogPrimitive.Title className="sr-only">Foto de {name}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <div className="relative size-[min(90vw,32rem)] cursor-zoom-out overflow-hidden rounded-3xl shadow-2xl">
              <Image src={src} alt={name ?? 'Foto do membro'} fill sizes="512px" className="object-cover" />
            </div>
          </DialogPrimitive.Close>
          <DialogPrimitive.Close
            className="absolute -top-12 right-0 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
            aria-label="Fechar"
          >
            <XIcon className="size-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
  /** Classes extras na imagem (ex.: zoom para logos com muita margem). */
  imageClassName?: string
  /** @deprecated O fallback agora é a imagem /hearth.png, não mais a inicial do nome. */
  textClassName?: string
}

const FALLBACK_AVATAR = '/hearth.png'

/**
 * Avatar com next/image (cache no edge da Vercel em vez de bater direto em
 * hosts de terceiros tipo lh3.googleusercontent.com) e fallback pro emblema da
 * Hebrom (/hearth.png) caso não haja foto ou a imagem falhe ao carregar.
 */
export function UserAvatar({ src, name, size, className, imageClassName }: UserAvatarProps) {
  const [prevSrc, setPrevSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // Se a src mudar (ex. usuário trocou de foto), dá outra chance antes de cair no fallback
  if (src !== prevSrc) {
    setPrevSrc(src)
    setHasError(false)
  }
  const displayName = name?.trim() || 'Membro'
  const showImage = !!src && !hasError

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        !showImage && 'bg-white',
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={displayName}
          fill
          sizes={size ? `${size}px` : '96px'}
          className={cn('object-cover', imageClassName)}
          onError={() => setHasError(true)}
        />
      ) : (
        <Image
          src={FALLBACK_AVATAR}
          alt={displayName}
          fill
          sizes={size ? `${size}px` : '96px'}
          className="object-contain p-[10%]"
        />
      )}
    </div>
  )
}

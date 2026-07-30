'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn, getAvatarColor } from '@/lib/utils'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
  textClassName?: string
}

/**
 * Avatar com next/image (cache no edge da Vercel em vez de bater direto em
 * hosts de terceiros tipo lh3.googleusercontent.com) e fallback pra iniciais
 * do nome com cor determinística caso não haja foto ou a imagem falhe ao carregar.
 */
export function UserAvatar({ src, name, size, className, textClassName }: UserAvatarProps) {
  const [prevSrc, setPrevSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // Se a src mudar (ex. usuário trocou de foto), dá outra chance antes de cair no fallback
  if (src !== prevSrc) {
    setPrevSrc(src)
    setHasError(false)
  }
  const displayName = name?.trim() || '?'
  const initial = displayName[0]?.toUpperCase() || '?'
  const showImage = !!src && !hasError

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        !showImage && getAvatarColor(displayName),
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
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={cn('font-bold uppercase', textClassName)}>{initial}</span>
      )}
    </div>
  )
}

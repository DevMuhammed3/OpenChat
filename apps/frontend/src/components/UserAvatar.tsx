'use client'

import { useMemo, useState } from 'react'
import { cn, getAvatarUrl } from '@openchat/lib'

export type UserAvatarProps = {
  name?: string | null
  avatar?: string | null
  alt?: string
  fallbackText?: string
  className?: string
  imgClassName?: string
  fallbackClassName?: string
}

function getFallback(text?: string | null) {
  const trimmed = (text ?? '').trim()
  return trimmed.charAt(0).toUpperCase() || '?'
}

export function UserAvatar({
  name,
  avatar,
  alt,
  fallbackText,
  className,
  imgClassName,
  fallbackClassName,
}: UserAvatarProps) {
  const displayName = (name ?? '').trim()

  const src = useMemo(() => {
    const trimmed = (avatar ?? '').trim()
    if (!trimmed) return null
    return getAvatarUrl(trimmed) ?? null
  }, [avatar])

  const fallback = fallbackText ? getFallback(fallbackText) : getFallback(displayName)
  const resolvedAlt = (alt ?? displayName).trim() || 'User avatar'

  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  const showImage = Boolean(src) && erroredSrc !== src
  const loaded = Boolean(src) && loadedSrc === src

  return (
    <div
      className={cn(
        'relative w-10 h-10 rounded-full overflow-hidden shrink-0',
        showImage && !loaded && 'bg-muted animate-pulse',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt={resolvedAlt}
          loading="lazy"
          decoding="async"
          className={cn(
            'w-full h-full object-cover transition-opacity',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          onLoad={() => setLoadedSrc(src!)}
          onError={() => {
            setErroredSrc(src!)
            setLoadedSrc(null)
          }}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center text-sm font-bold text-primary',
            fallbackClassName ?? 'bg-gradient-to-br from-primary/20 to-primary/5',
          )}
        >
          {fallback}
        </div>
      )}
    </div>
  )
}


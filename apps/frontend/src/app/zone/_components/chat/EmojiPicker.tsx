'use client'

import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { X } from 'lucide-react'
import { cn } from '@openchat/lib'

const Picker = lazy(() => import('@emoji-mart/react'))

function PickerFallback() {
  return (
    <div className="w-72 h-80 bg-background rounded-2xl border border-border flex items-center justify-center">
      <span className="text-muted-foreground text-sm animate-pulse">Loading...</span>
    </div>
  )
}

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
  onClose: () => void
  className?: string
}

export default function EmojiPicker({ onSelect, onClose, className }: EmojiPickerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node
    if (pickerRef.current && !pickerRef.current.contains(target)) {
      onClose()
    }
  }, [onClose])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (!isMounted) return
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMounted, handleClickOutside, handleKeyDown])

  if (!isMounted) return null

  return (
    <div
      ref={pickerRef}
      className={cn(
        'fixed bottom-[5.5rem] right-4 md:right-8 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-150',
        className
      )}
    >
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/90 hover:bg-muted transition-colors shadow-lg border border-border"
          aria-label="Close emoji picker"
        >
          <X className="w-4 h-4" />
        </button>
        
        <Suspense fallback={<PickerFallback />}>
          <Picker
            data={async () => {
              const module = await import('@emoji-mart/data')
              return module.default
            }}
            onEmojiClick={(emoji: { native: string }) => {
              onSelect(emoji.native)
              onClose()
            }}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            set="native"
            perLine={8}
            emojiSize={22}
            emojiButtonSize={32}
            initialCategory="people"
            I18n={{
              search: 'Search...',
              categories: {
                activity: 'Activity',
                custom: 'Custom',
                flags: 'Flags',
                foods: 'Food',
                nature: 'Nature',
                objects: 'Objects',
                people: 'Smileys',
                symbols: 'Symbols',
                travel: 'Travel'
              }
            }}
            style={{
              backgroundColor: 'hsl(var(--background) / 1)',
              borderRadius: '14px',
              border: '1px solid hsl(var(--border) / 1)',
              width: '320px'
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
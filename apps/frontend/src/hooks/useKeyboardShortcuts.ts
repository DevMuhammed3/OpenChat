'use client'

import { useEffect, useCallback, useRef } from 'react'
import { 
  applyGlobalMuteToggle, 
  toggleSpeakerOutput 
} from '@/app/lib/session-runtime'
import {
  loadShortcuts,
  parseShortcutString,
  shortcutsEqual,
  normalizeKey,
  MODIFIER_KEYS,
} from '@/lib/keyboard-shortcuts'

const IGNORE_TAGS = new Set(['INPUT', 'TEXTAREA'])

function isInputElement(element: Element | null): boolean {
  if (!element) return false
  if (IGNORE_TAGS.has(element.tagName)) return true
  if (element.getAttribute('contenteditable') === 'true') return true
  return false
}

export function useKeyboardShortcuts() {
  const shortcutsRef = useRef(loadShortcuts())
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isInputElement(document.activeElement)) return
    
    const pressed: string[] = []
    if (e.ctrlKey || e.metaKey) pressed.push('ctrl')
    if (e.shiftKey) pressed.push('shift')
    if (e.altKey) pressed.push('alt')
    if (e.metaKey) pressed.push('meta')
    
    const key = normalizeKey(e.key)
    if (!MODIFIER_KEYS.has(key)) {
      pressed.push(key)
    }
    
    if (pressed.length === 0) return
    
    const shortcuts = shortcutsRef.current
    const muteKeys = parseShortcutString(shortcuts.mute)
    const deafenKeys = parseShortcutString(shortcuts.deafen)
    
    if (muteKeys.length > 0 && shortcutsEqual(pressed, muteKeys)) {
      e.preventDefault()
      e.stopPropagation()
      void applyGlobalMuteToggle()
      return
    }
    
    if (deafenKeys.length > 0 && shortcutsEqual(pressed, deafenKeys)) {
      e.preventDefault()
      e.stopPropagation()
      toggleSpeakerOutput()
      return
    }
  }, [])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])
  
  return shortcutsRef
}
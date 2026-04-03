'use client'

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function KeyboardShortcutsListener() {
  useKeyboardShortcuts()
  return null
}
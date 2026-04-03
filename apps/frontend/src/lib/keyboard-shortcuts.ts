'use client'

export type ShortcutAction = 'mute' | 'deafen'

export interface KeyboardShortcut {
  action: ShortcutAction
  keys: string[]
}

export const STORAGE_KEY = 'openchat-keyboard-shortcuts'

export const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta', 'ctrl'])

export function normalizeKey(key: string): string {
  const lower = key.toLowerCase()
  const keyMap: Record<string, string> = {
    'control': 'ctrl',
    'escape': 'esc',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
    ' ': 'space',
  }
  return keyMap[lower] || lower
}

export function isValidShortcut(keys: string[]): boolean {
  const normalized = keys.map(normalizeKey)
  const nonModifiers = normalized.filter(k => !MODIFIER_KEYS.has(k))
  return nonModifiers.length >= 1
}

export function formatShortcut(keys: string[]): string {
  const order = ['ctrl', 'alt', 'shift', 'meta']
  const normalized = keys.map(normalizeKey)
  
  const modifiers = normalized.filter(k => MODIFIER_KEYS.has(k)).sort((a, b) => order.indexOf(a) - order.indexOf(b))
  const nonModifiers = normalized.filter(k => !MODIFIER_KEYS.has(k))
  
  return [...modifiers, ...nonModifiers].join(' + ')
}

export function parseShortcutString(shortcut: string): string[] {
  return shortcut.split(' + ').map(normalizeKey)
}

export function shortcutsEqual(a: string[], b: string[]): boolean {
  const normalize = (keys: string[]) => keys.map(normalizeKey).sort()
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
}

export interface StoredShortcuts {
  mute: string
  deafen: string
}

export function loadShortcuts(): StoredShortcuts {
  if (typeof window === 'undefined') {
    return { mute: '', deafen: '' }
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('[KeyboardShortcuts] Failed to load shortcuts:', e)
  }
  
  return { mute: '', deafen: '' }
}

export function saveShortcuts(shortcuts: StoredShortcuts): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
  } catch (e) {
    console.error('[KeyboardShortcuts] Failed to save shortcuts:', e)
  }
}

export function hasConflict(newKeys: string[], existing: StoredShortcuts): boolean {
  const normalized = newKeys.map(normalizeKey)
  const existingKeys = [parseShortcutString(existing.mute), parseShortcutString(existing.deafen)]
  
  return existingKeys.some(keys => keys.length > 0 && shortcutsEqual(normalized, keys))
}
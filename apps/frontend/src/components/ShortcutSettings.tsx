'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Keyboard, X, RotateCcw } from 'lucide-react'
import {
  loadShortcuts,
  saveShortcuts,
  formatShortcut,
  isValidShortcut,
  hasConflict,
  normalizeKey,
  MODIFIER_KEYS,
  type StoredShortcuts,
} from '@/lib/keyboard-shortcuts'

interface ShortcutRecorderProps {
  action: 'mute' | 'deafen'
  value: string
  onChange: (value: string) => void
  otherShortcut: string
}

function ShortcutRecorder({ action, value, onChange, otherShortcut }: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [currentKeys, setCurrentKeys] = useState<string[]>([])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!recording) return

    const key = normalizeKey(e.key)

    if (key === 'escape') {
      setRecording(false)
      setCurrentKeys([])
      return
    }

    const keys: string[] = []
    if (e.ctrlKey || e.metaKey) keys.push('ctrl')
    if (e.shiftKey) keys.push('shift')
    if (e.altKey) keys.push('alt')
    if (e.metaKey) keys.push('meta')

    if (!MODIFIER_KEYS.has(key)) {
      keys.push(key)
    }

    if (keys.length > 0) {
      setCurrentKeys(keys)
    }
  }, [recording])

  const handleKeyUp = useCallback(() => {
    if (!recording || currentKeys.length === 0) return

    if (!isValidShortcut(currentKeys)) {
      toast.error('Shortcut must include at least one non-modifier key')
      setCurrentKeys([])
      return
    }

    const conflictCheck: StoredShortcuts = action === 'mute'
      ? { mute: formatShortcut(currentKeys), deafen: otherShortcut }
      : { mute: otherShortcut, deafen: formatShortcut(currentKeys) }

    if (hasConflict(currentKeys, conflictCheck)) {
      toast.error('This shortcut is already used')
      setCurrentKeys([])
      return
    }

    onChange(formatShortcut(currentKeys))
    setRecording(false)
    setCurrentKeys([])
  }, [recording, currentKeys, onChange, otherShortcut, action])

  useEffect(() => {
    if (recording) {
      document.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('keyup', handleKeyUp, true)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [recording, handleKeyDown, handleKeyUp])

  const startRecording = () => {
    setRecording(true)
    setCurrentKeys([])
  }

  const clearShortcut = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const label = action === 'mute' ? 'Mute' : 'Deafen'

  const renderKeyBadge = (key: string) => (
    <span
      key={key}
      className="inline-flex items-center px-1.5 py-0.5 bg-zinc-700/80 border border-zinc-600 rounded text-[10px] font-medium text-zinc-200"
    >
      {key === 'ctrl' ? 'Ctrl' : key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  )

  const renderShortcutDisplay = (shortcut: string) => {
    const keys = shortcut.split(' + ')
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && <span className="text-zinc-500 mx-0.5 text-xs">+</span>}
            {renderKeyBadge(key)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <div className="flex items-center gap-2">
        {recording ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/50 rounded-md min-w-[160px]">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-sm text-purple-300">
              {currentKeys.length > 0
                ? renderShortcutDisplay(formatShortcut(currentKeys))
                : 'Press keys...'}
            </span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-md min-w-[140px]">
            {renderShortcutDisplay(value)}
            <button
              onClick={clearShortcut}
              className="ml-1 p-0.5 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Clear shortcut"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors min-w-[80px]"
          >
            Not set
          </button>
        )}
      </div>
    </div>
  )
}

interface ShortcutSettingsProps {
  className?: string
}

export function ShortcutSettings({ className }: ShortcutSettingsProps) {
  const [shortcuts, setShortcuts] = useState<StoredShortcuts>({ mute: '', deafen: '' })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loaded = loadShortcuts()
    setShortcuts(loaded)
    setIsLoaded(true)
  }, [])

  const handleChange = useCallback((action: 'mute' | 'deafen', value: string) => {
    setShortcuts(prev => {
      const updated = { ...prev, [action]: value }
      saveShortcuts(updated)
      return updated
    })
    if (value) {
      toast.success(`${action === 'mute' ? 'Mute' : 'Deafen'} shortcut updated`)
    }
  }, [])

  const handleReset = () => {
    const defaults = { mute: '', deafen: '' }
    setShortcuts(defaults)
    saveShortcuts(defaults)
    toast.success('Shortcuts reset to defaults')
  }

  if (!isLoaded) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-200">Keyboard Shortcuts</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-white/5">
        <ShortcutRecorder
          action="mute"
          value={shortcuts.mute}
          onChange={(value) => handleChange('mute', value)}
          otherShortcut={shortcuts.deafen}
        />
        <ShortcutRecorder
          action="deafen"
          value={shortcuts.deafen}
          onChange={(value) => handleChange('deafen', value)}
          otherShortcut={shortcuts.mute}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Press Escape to cancel recording. Shortcuts are disabled when typing in input fields.
      </p>
    </div>
  )
}

export default ShortcutSettings
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'packages/ui'
import { Keyboard, X } from 'lucide-react'
import { toast } from 'sonner'
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    if (hasConflict(currentKeys, { mute: action === 'mute' ? formatShortcut(currentKeys) : value, deafen: action === 'deafen' ? formatShortcut(currentKeys) : otherShortcut })) {
      toast.error('This shortcut is already used')
      setCurrentKeys([])
      return
    }

    onChange(formatShortcut(currentKeys))
    setRecording(false)
    setCurrentKeys([])
  }, [recording, currentKeys, onChange, value, otherShortcut, action])

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

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {recording ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border border-purple-500/50 rounded-md min-w-[120px]">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-sm text-purple-300">
              {currentKeys.length > 0 ? formatShortcut(currentKeys) : 'Press keys...'}
            </span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md min-w-[120px]">
            <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-mono">{value}</span>
            <button
              onClick={clearShortcut}
              className="ml-1 p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Clear shortcut"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/50 border-border rounded-md transition-colors min-w-[120px]"
          >
            Not set
          </button>
        )}
      </div>
    </div>
  )
}

export default function KeyboardShortcutsPage() {
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

  if (!isLoaded) {
    return null
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Keyboard Shortcuts</h1>
        <p className="text-muted-foreground text-sm">
          Customize keyboard shortcuts for quick mute and deafen actions.
        </p>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Shortcuts
          </CardTitle>
          <CardDescription>
            Press the button to record a new shortcut. Use combinations like Ctrl+Shift+M or Alt+D.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-base">Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Shortcuts work only when the app window is focused</p>
          <p>• Shortcuts are disabled when typing in input fields</p>
          <p>• Press Escape to cancel recording</p>
          <p>• Each shortcut must include at least one non-modifier key</p>
        </CardContent>
      </Card>
    </div>
  )
}
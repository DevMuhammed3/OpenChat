'use client'

import { useEffect, useRef } from "react"

export function useAudioUnlock() {
  const unlockedRef = useRef(false)

  useEffect(() => {
    const unlock = async () => {
      if (unlockedRef.current) return

      try {
        const audio = new Audio()
        audio.muted = true
        await audio.play()
        unlockedRef.current = true
      } catch {
      }

      document.removeEventListener("click", unlock)
      document.removeEventListener("keydown", unlock)
    }

    document.addEventListener("click", unlock)
    document.addEventListener("keydown", unlock)

    return () => {
      document.removeEventListener("click", unlock)
      document.removeEventListener("keydown", unlock)
    }
  }, [])
}


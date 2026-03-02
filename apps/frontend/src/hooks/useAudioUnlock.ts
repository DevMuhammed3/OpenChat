'use client'

import { useEffect } from "react"

let audioContext: AudioContext | null = null

export function useAudioUnlock() {
  useEffect(() => {
    function unlock() {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      window.removeEventListener("click", unlock)
      window.removeEventListener("touchstart", unlock)
    }

    window.addEventListener("click", unlock)
    window.addEventListener("touchstart", unlock)

    return () => {
      window.removeEventListener("click", unlock)
      window.removeEventListener("touchstart", unlock)
    }
  }, [])
}

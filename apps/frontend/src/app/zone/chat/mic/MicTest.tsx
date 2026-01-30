'use client'
import { useRef, useState } from "react"
import { Button } from "packages/ui"

export default function MicTest() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isOn, setIsOn] = useState(false)

  async function toggleMic() {
    if (isOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.srcObject = null
      }

      setIsOn(false)
      return
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    streamRef.current = stream

    if (audioRef.current) {
      audioRef.current.srcObject = stream
      audioRef.current.play().catch(() => { })
    }

    setIsOn(true)
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={toggleMic}>
        {isOn ? "⛔ Stop Mic" : "🎤 Test Mic"}
      </Button>

      <audio ref={audioRef} autoPlay />
    </div>
  )
}

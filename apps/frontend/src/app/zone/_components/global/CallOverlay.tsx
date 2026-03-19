'use client'

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button
} from "packages/ui"
import { Lock, Phone, PhoneOff, Mic, MicOff } from "lucide-react"
import { useCallStore } from "@/app/stores/call-store"
import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react"

interface Props {
  onAccept: () => void
  onReject: () => void
  onEnd: () => void
  toggleMute?: (muted: boolean) => void
}

export default function CallOverlay({
  onAccept,
  onReject,
  onEnd,
  toggleMute,
}: Props) {
  const { status, user, isMuted, toggleMuted } = useCallStore()
  const [seconds, setSeconds] = useState(0)
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 16, y: 16 }
    }

    const width = Math.min(360, window.innerWidth - 32)
    const height = 320

    return {
      x: Math.max(16, (window.innerWidth - width) / 2),
      y: Math.max(16, (window.innerHeight - height) / 2),
    }
  })
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const draggingRef = useRef(false)

  useEffect(() => {
    if (status !== "connected") return

    const startedAt = Date.now()
    let frameId = 0

    const tick = () => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }

    frameId = window.requestAnimationFrame(tick)
    const interval = window.setInterval(tick, 1000)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearInterval(interval)
    }
  }, [status])

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!draggingRef.current) return

      setPosition({
        x: Math.max(16, event.clientX - dragOffsetRef.current.x),
        y: Math.max(16, event.clientY - dragOffsetRef.current.y),
      })
    }

    const handleUp = () => {
      draggingRef.current = false
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [])

  if (status === "idle" || !user) return null

  const formatTime = () => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted
    toggleMuted()
    if (toggleMute) toggleMute(nextMuted)
  }

  const handleDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest("button")) return

    draggingRef.current = true
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        className="pointer-events-auto absolute w-[min(360px,calc(100vw-2rem))] bg-background/95 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-300"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div
          className="mb-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
            Voice Call
          </span>
          <span className="text-[10px] text-zinc-500">Drag</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
          <Lock className="h-3.5 w-3.5" />
          Secure via WebRTC
        </div>

        <div className="flex items-center gap-4">
          <Avatar className={`h-16 w-16 border-2 border-primary/20 ${status !== "connected" ? "animate-pulse" : ""}`}>
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.name?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{user.name}</h3>
            <p className="text-sm text-muted-foreground font-medium">
              {status === "calling" && "Calling..."}
              {status === "incoming" && "Incoming call..."}
              {status === "connecting" && "Connecting..."}
              {status === "connected" && (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {formatTime()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {status === "incoming" && (
            <>
              <Button
                size="lg"
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2 h-12"
                onClick={onAccept}
              >
                <Phone className="h-5 w-5 fill-current" />
                <span>Accept</span>
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1 rounded-xl h-12 gap-2"
                onClick={onReject}
              >
                <PhoneOff className="h-5 w-5 fill-current" />
                <span>Reject</span>
              </Button>
            </>
          )}

          {(status === "calling" || status === "connecting") && (
            <Button
              variant="destructive"
              className="w-full rounded-xl h-12 gap-2"
              onClick={onEnd}
            >
              <PhoneOff className="h-5 w-5 fill-current" />
              <span>Cancel</span>
            </Button>
          )}

          {status === "connected" && (
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                size="icon"
                className={`flex-1 rounded-xl h-12 ${isMuted ? "bg-red-100 border-red-200 text-red-600 hover:bg-red-200" : ""}`}
                onClick={handleToggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-[2] rounded-xl h-12 gap-2"
                onClick={onEnd}
              >
                <PhoneOff className="h-5 w-5 fill-current" />
                <span>End Call</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button
} from "packages/ui"
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react"
import { useCallStore } from "@/app/stores/call-store"
import { useEffect, useState } from "react"

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

  useEffect(() => {
    if (status !== "connected") {
      setSeconds(0)
      return
    }

    const interval = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [status])

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

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <div className="pointer-events-auto w-[320px] bg-background/95 backdrop-blur-sm border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
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

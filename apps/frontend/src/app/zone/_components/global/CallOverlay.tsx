'use client'

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button
} from "packages/ui"
import { Phone, PhoneOff } from "lucide-react"
import { useCallStore } from "@/app/stores/call-store"
import { useEffect, useState } from "react"

interface Props {
  onAccept: () => void
  onReject: () => void
  onEnd: () => void
}

export default function CallOverlay({
  onAccept,
  onReject,
  onEnd,
}: Props) {
  const { status, user } = useCallStore()
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

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center">

      <div className="w-[380px] bg-background rounded-3xl p-8 text-center space-y-8 shadow-2xl">

        {/* Avatar */}
        <div className="flex justify-center">
          <Avatar
            className={`h-32 w-32 ${status !== "connected" ? "animate-pulse" : ""
              }`}
          >
            <AvatarImage src={user.image} />
            <AvatarFallback>
              {user.name?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name + Status */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{user.name}</h2>

          {status === "calling" && (
            <p className="text-muted-foreground">Calling...</p>
          )}

          {status === "incoming" && (
            <p className="text-muted-foreground">Incoming Call</p>
          )}

          {status === "connected" && (
            <p className="text-muted-foreground">
              {formatTime()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-8 pt-4">

          {status === "incoming" && (
            <>
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700"
                onClick={onAccept}
              >
                <Phone className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                // variant="destructive"
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                onClick={onEnd}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          )}

          {status === "calling" && (
            <Button
              size="icon"
              variant="destructive"
              className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
              onClick={onEnd}
            >
              <PhoneOff className="h-6 w-6 " />
            </Button>
          )}

          {status === "connected" && (
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
              onClick={onEnd}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>)}
        </div>
      </div>
    </div>
  )
}

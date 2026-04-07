'use client'

import { useEffect, useRef } from "react"
import { socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import CallOverlay from "@/app/zone/_components/global/CallOverlay"
import { useVoiceCall } from "@/hooks/useVoiceCall"
import { endCallSession } from "@/app/lib/session-runtime"

type CallStatusPayload = {
  status: "idle" | "calling" | "incoming" | "connected"
  chatPublicId?: string
  user?: {
    id: number
    name: string
    image?: string | null
  } | null
  isCaller?: boolean
  startTime?: number
}

type IncomingCallPayload = {
  chatPublicId: string
  user: {
    id: number
    name: string
    image?: string | null
  }
}

export default function GlobalCallProvider() {
  const status = useCallStore((s) => s.status)
  const chatPublicId = useCallStore((s) => s.chatPublicId)
  const channelPublicId = useCallStore((s) => s.channelPublicId)
  const isCaller = useCallStore((s) => s.isCaller)
  const setIncoming = useCallStore((s) => s.setIncoming)
  const setConnected = useCallStore((s) => s.setConnected)
  const clear = useCallStore((s) => s.clear)
  const setCalling = useCallStore((s) => s.setCalling)
  const {
    startCall,
    acceptCall,
    endCall,
    remoteAudioRef,
  } = useVoiceCall()

  /* =========================
     INITIAL CHECK (Persistence)
  ========================== */
  useEffect(() => {
    const handleRecheck = () => {
        if (socket.connected) {
            socket.emit("call:check")
        }
    }

    const timer = setTimeout(handleRecheck, 1000)

    const statusHandler = (payload: CallStatusPayload) => {
        if (payload.status === "idle") {
            clear()
            return
        }

        if (!payload.chatPublicId) {
            return
        }

        // Restore state based on server response
        if (!payload.user) {
            return
        }

        if (payload.status === "calling") {
            setCalling(payload.chatPublicId, payload.user)
        } else if (payload.status === "incoming") {
            setIncoming(payload.chatPublicId, payload.user)
        } else if (payload.status === "connected") {
            useCallStore.setState({ 
                status: "connected", 
                chatPublicId: payload.chatPublicId, 
                user: payload.user,
                isCaller: payload.isCaller,
                startedAt: payload.startTime ?? Date.now(),
            })
        }
    }

    socket.on("call:status", statusHandler)
    socket.on("connect", handleRecheck)

    return () => {
      clearTimeout(timer)
      socket.off("call:status", statusHandler)
      socket.off("connect", handleRecheck)
    }
  }, [clear, setCalling, setIncoming])

  /* =========================
     SOCKET LISTENERS
  ========================== */

  useEffect(() => {
    const incomingHandler = (payload: IncomingCallPayload) => {
      const { chatPublicId, user } = payload
      socket.emit("join-room", { chatPublicId })
      setIncoming(chatPublicId, user)
    }

    const rejoinedHandler = ({ userId: joinedUserId }: { userId: number }) => {
        const state = useCallStore.getState()
        // If we are already connected and we are the caller, re-send the offer
        if (state.status === "connected" && state.isCaller && state.chatPublicId) {
            startCall(state.chatPublicId)
        }
    }

    socket.on("incoming:call", incomingHandler)
    const acceptedHandler = ({ startTime }: { chatPublicId: string; startTime?: number }) => {
      setConnected(startTime)
    }

    socket.on("call:accepted", acceptedHandler)
    socket.on("call:rejected", clear)
    socket.on("call:ended", clear)
    socket.on("call:rejoined", rejoinedHandler)
    
    const partnerDisconnectedHandler = ({ userId }: { userId: number }) => {
    }

    socket.on("call:partner-disconnected", partnerDisconnectedHandler)

    return () => {
      socket.off("incoming:call", incomingHandler)
      socket.off("call:accepted", acceptedHandler)
      socket.off("call:rejected", clear)
      socket.off("call:ended", clear)
      socket.off("call:rejoined", rejoinedHandler)
      socket.off("call:partner-disconnected", partnerDisconnectedHandler)
    }
  }, [setIncoming, setConnected, clear, startCall])

  useEffect(() => {
    const handleDisconnect = () => {
      endCall({ notifyServer: false, clearState: true })
    }

    socket.on("disconnect", handleDisconnect)

    return () => {
      socket.off("disconnect", handleDisconnect)
    }
  }, [endCall])

  /* =========================
     VOICE CALL HANDSHAKE
  ========================== */

  useEffect(() => {
    if (status === "connected" && chatPublicId && isCaller) {
      startCall(chatPublicId)
    }

    if ((status === "connecting" || status === "connected") && chatPublicId && !isCaller) {
      acceptCall()
    }
  }, [status, chatPublicId, isCaller, startCall, acceptCall])

  useEffect(() => {
    if (!channelPublicId || status === "idle" || !chatPublicId) return

    void endCallSession({ notifyServer: true })
  }, [channelPublicId, chatPublicId, status])

  /* =========================
     INTERNAL APP LOGIC (RINGTONES)
  ========================== */

  const callingAudioRef = useRef<HTMLAudioElement | null>(null)
  const incomingAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const callingAudio = callingAudioRef.current
    const incomingAudio = incomingAudioRef.current

    if (!callingAudio || !incomingAudio) return

    if (status === "calling") {
      callingAudio.loop = true
      callingAudio.currentTime = 0
      callingAudio.play().catch(() => { })
    } else {
      callingAudio.pause()
      callingAudio.currentTime = 0
    }

    if (status === "incoming") {
      incomingAudio.loop = true
      incomingAudio.currentTime = 0
      incomingAudio.play().catch(() => { })
    } else {
      incomingAudio.pause()
      incomingAudio.currentTime = 0
    }
  }, [status])

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay />
      
      <audio
        ref={callingAudioRef}
        src="/sounds/callingV3Edit.mp3"
        preload="auto"
      />
      <audio
        ref={incomingAudioRef}
        src="/sounds/rining.mp3"
        preload="auto"
      />

      <CallOverlay
        onAccept={() => {
          const state = useCallStore.getState()
          if (state.chatPublicId) {
            socket.emit("call:accept", { chatPublicId: state.chatPublicId })
            useCallStore.getState().setConnecting()
          }
        }}
        onReject={() => {
          const state = useCallStore.getState()
          if (state.chatPublicId) {
            socket.emit("call:reject", { chatPublicId: state.chatPublicId })
          }
          endCall({ notifyServer: false, clearState: true })
        }}
        onEnd={() => {
          void endCallSession({ notifyServer: true })
        }}
      />
    </>
  )
}

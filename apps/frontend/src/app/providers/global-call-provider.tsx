'use client'

import { useEffect, useRef } from "react"
import { socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import CallOverlay from "@/app/zone/_components/global/CallOverlay"
import { useVoiceCall } from "@/hooks/useVoiceCall"

export default function GlobalCallProvider() {
  const { status, user, chatPublicId, isCaller, setIncoming, setConnected, clear, setCalling } = useCallStore()
  const {
    startCall,
    acceptCall,
    endCall,
    remoteAudioRef,
    toggleMute
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

    const statusHandler = (payload: any) => {
        console.log("[GlobalCallProvider] call:status received:", payload)
        if (payload.status === "idle") {
            clear()
            return
        }

        // Restore state based on server response
        if (payload.status === "calling") {
            setCalling(payload.chatPublicId, payload.user)
        } else if (payload.status === "incoming") {
            setIncoming(payload.chatPublicId, payload.user)
        } else if (payload.status === "connected") {
            // Re-connect logic: Set state to connected and caller flag
            // Ensure chatPublicId is set so startCall/acceptCall can trigger
            useCallStore.setState({ 
                status: "connected", 
                chatPublicId: payload.chatPublicId, 
                user: payload.user,
                isCaller: payload.isCaller
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
    const incomingHandler = (payload: any) => {
      const { chatPublicId, user } = payload
      socket.emit("join-room", { chatPublicId })
      setIncoming(chatPublicId, user)
    }

    const rejoinedHandler = ({ userId: joinedUserId }: { userId: number }) => {
        console.log("[GlobalCallProvider] Partner rejoined:", joinedUserId)
        const state = useCallStore.getState()
        // If we are already connected and we are the caller, re-send the offer
        if (state.status === "connected" && state.isCaller && state.chatPublicId) {
            startCall(state.chatPublicId)
        }
    }

    socket.on("incoming:call", incomingHandler)
    socket.on("call:accepted", setConnected)
    socket.on("call:rejected", clear)
    socket.on("call:ended", clear)
    socket.on("call:rejoined", rejoinedHandler)
    
    socket.on("call:partner-disconnected", ({ userId }: any) => {
        console.log(`Partner ${userId} disconnected. Waiting for them...`)
    })

    return () => {
      socket.off("incoming:call", incomingHandler)
      socket.off("call:accepted", setConnected)
      socket.off("call:rejected", clear)
      socket.off("call:ended", clear)
      socket.off("call:rejoined", rejoinedHandler)
      socket.off("call:partner-disconnected")
    }
  }, [setIncoming, setConnected, clear, startCall])

  /* =========================
     VOICE CALL HANDSHAKE
  ========================== */

  useEffect(() => {
    if (status === "connected" && chatPublicId && isCaller) {
      startCall(chatPublicId)
    }
    
    if (status === "connecting" && chatPublicId && !isCaller) {
      acceptCall()
    }
  }, [status, chatPublicId, isCaller, startCall, acceptCall])

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

  if (status === "idle") return null

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
          clear()
        }}
        onEnd={() => {
          const state = useCallStore.getState()
          if (state.chatPublicId) {
            socket.emit("call:end", { chatPublicId: state.chatPublicId })
          }
          endCall()
          clear()
        }}
        toggleMute={toggleMute}
      />
    </>
  )
}

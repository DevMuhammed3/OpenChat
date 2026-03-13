'use client'

import { useEffect, useRef } from "react"
import { socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import CallOverlay from "@/app/zone/_components/global/CallOverlay"
import { useVoiceCall } from "@/hooks/useVoiceCall"

export default function GlobalCallProvider() {
  const { status, user, chatPublicId, isCaller, setIncoming, setConnected, clear } = useCallStore()
  const { 
    startCall, 
    acceptCall, 
    endCall, 
    remoteAudioRef, 
    ringtoneRef,
    playRingtone,
    stopRingtone
  } = useVoiceCall()

  /* =========================
     SOCKET LISTENERS
  ========================== */

  useEffect(() => {
    const incomingHandler = async (payload: any) => {
      console.log("INCOMING PAYLOAD:", payload)
      const { chatPublicId, user } = payload
      setIncoming(chatPublicId, user)
    }

    const acceptedHandler = () => {
      setConnected()
    }

    const rejectedHandler = () => {
      clear()
    }

    const endedHandler = () => {
      clear()
    }

    socket.on("incoming:call", incomingHandler)
    socket.on("call:accepted", acceptedHandler)
    socket.on("call:rejected", rejectedHandler)
    socket.on("call:ended", endedHandler)

    return () => {
      socket.off("incoming:call", incomingHandler)
      socket.off("call:accepted", acceptedHandler)
      socket.off("call:rejected", rejectedHandler)
      socket.off("call:ended", endedHandler)
    }
  }, [setIncoming, setConnected, clear])

  /* =========================
     VOICE CALL SYNC
  ========================== */
  
  useEffect(() => {
    // Only the caller initiates the WebRTC offer (startCall)
    if (status === "connected" && chatPublicId && isCaller) {
      startCall(chatPublicId)
    }
  }, [status, chatPublicId, isCaller, startCall])

  /* =========================
     RING SOUNDS
  ========================== */

  const outgoingAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const outgoingAudio = outgoingAudioRef.current
    if (!outgoingAudio) return

    if (status === "calling") {
      outgoingAudio.loop = true
      outgoingAudio.currentTime = 0
      outgoingAudio.play().catch(() => { })
    } else {
      outgoingAudio.pause()
      outgoingAudio.currentTime = 0
    }

    // Incoming call sound
    if (status === "incoming") {
      playRingtone()
    } else {
      // Only stop if we are not connected yet or cleared
      if (status !== "connected") {
        stopRingtone()
      }
    }
  }, [status, playRingtone, stopRingtone])

  useEffect(() => {
    function handleUnload() {
      const state = useCallStore.getState()
      if (state.status !== "idle" && state.user?.id && state.chatPublicId) {
        socket.emit("call:end", {
          toUserId: state.user.id,
          chatPublicId: state.chatPublicId,
        })
        endCall()
      }
    }

    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [endCall])

  if (status === "idle") return null

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay />
      <audio ref={ringtoneRef} src="/sounds/rining.mp3" preload="auto" />
      
      <audio
        ref={outgoingAudioRef}
        src="/sounds/callingV3Edit.mp3"
        preload="auto"
      />

      <CallOverlay
        onAccept={async () => {
          const state = useCallStore.getState()
          if (state.user?.id && state.chatPublicId) {
            socket.emit("call:accept", {
              toUserId: state.user.id,
              chatPublicId: state.chatPublicId,
            })
            setConnected()
          }
        }}
        onReject={() => {
          const state = useCallStore.getState()
          if (state.user?.id && state.chatPublicId) {
            socket.emit("call:reject", {
              toUserId: state.user.id,
              chatPublicId: state.chatPublicId,
            })
          }
          endCall()
          clear()
        }}
        onEnd={() => {
          const state = useCallStore.getState()
          if (state.user?.id && state.chatPublicId) {
            socket.emit("call:end", {
              toUserId: state.user.id,
              chatPublicId: state.chatPublicId,
            })
          }
          endCall()
          clear()
        }}
      />
    </>
  )
}

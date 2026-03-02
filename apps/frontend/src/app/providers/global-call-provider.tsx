'use client'

import { useEffect, useRef } from "react"
import { socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import CallOverlay from "@/app/zone/_components/global/CallOverlay"

export default function GlobalCallProvider() {
  const { status, setIncoming, setConnected, clear } = useCallStore()

  const callingAudioRef = useRef<HTMLAudioElement | null>(null)
  const incomingAudioRef = useRef<HTMLAudioElement | null>(null)

  /* =========================
     SOCKET LISTENERS
  ========================== */

  useEffect(() => {
    const incomingHandler = (payload: any) => {
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
     RING SOUNDS
  ========================== */

  useEffect(() => {
    const callingAudio = callingAudioRef.current
    const incomingAudio = incomingAudioRef.current

    if (!callingAudio || !incomingAudio) return

    // Outgoing call sound
    if (status === "calling") {
      callingAudio.loop = true
      callingAudio.currentTime = 0
      callingAudio.play().catch(() => { })
    } else {
      callingAudio.pause()
      callingAudio.currentTime = 0
    }

    // Incoming call sound
    if (status === "incoming") {
      incomingAudio.loop = true
      incomingAudio.currentTime = 0
      incomingAudio.play().catch(() => { })
    } else {
      incomingAudio.pause()
      incomingAudio.currentTime = 0
    }
  }, [status])


  useEffect(() => {
    function handleUnload() {
      const { status, user, chatPublicId } =
        useCallStore.getState()

      if (status !== "idle" && user?.id && chatPublicId) {
        socket.emit("call:end", {
          toUserId: user.id,
          chatPublicId,
        })
      }
    }

    window.addEventListener("beforeunload", handleUnload)

    return () => {
      window.removeEventListener("beforeunload", handleUnload)
    }
  }, [])

  if (status === "idle") return null

  return (
    <>
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
          const { user, chatPublicId } =
            useCallStore.getState()

          if (user?.id && chatPublicId) {
            socket.emit("call:accept", {
              toUserId: user.id,
              chatPublicId,
            })
          }

          setConnected()
        }}
        onReject={() => {
          const { user, chatPublicId } =
            useCallStore.getState()

          if (user?.id && chatPublicId) {
            socket.emit("call:reject", {
              toUserId: user.id,
              chatPublicId,
            })
          }

          clear()
        }}
        onEnd={() => {
          const { user, chatPublicId } =
            useCallStore.getState()

          if (user?.id && chatPublicId) {
            socket.emit("call:end", {
              toUserId: user.id,
              chatPublicId,
            })
          }

          clear()
        }}
      />
    </>
  )
}

'use client'

import { useEffect } from "react"
import { socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"

export default function GlobalCallListener() {
  useEffect(() => {

    socket.on("incoming:call", ({ fromUserId, chatPublicId }) => {
      useCallStore.getState().setIncoming(fromUserId, chatPublicId)
    })

    socket.on("call:accepted", () => {
      useCallStore.getState().setConnected()
    })

    socket.on("call:rejected", () => {
      useCallStore.getState().clear()
    })

    socket.on("call:ended", () => {
      useCallStore.getState().clear()
    })

    return () => {
      socket.off("incoming:call")
      socket.off("call:accepted")
      socket.off("call:rejected")
      socket.off("call:ended")
    }
  }, [])

  return null
}

"use client"

import { useEffect, useState } from "react"
import { socket, playMessageSound, api } from "@openchat/lib"
import { useChatsStore } from "../stores/chat-store"

type SocketMessage = {
  id: number
  text: string
  senderId: number
  chatPublicId: string
  createdAt: string
  deliveredInRoom?: boolean
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [myUserId, setMyUserId] = useState<number | null>(null)

  useEffect(() => {
    api("/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) {
          setMyUserId(data.user.id)
        }
      })
  }, [])

  useEffect(() => {
    if (!myUserId) return

    const handler = (msg: SocketMessage) => {
      const store = useChatsStore.getState()


      if (msg.senderId === myUserId) return

      if (
        store.activeChatPublicId === msg.chatPublicId &&
        msg.deliveredInRoom === true
      ) {
        return
      }

      store.incrementUnread(msg.chatPublicId)
      store.onIncomingMessage(msg.chatPublicId)
      playMessageSound()

      playMessageSound()
    }

    socket.on("private-message", handler)
    return () => {
      socket.off("private-message", handler)
    }
  }, [myUserId])

  return <>{children}</>
}


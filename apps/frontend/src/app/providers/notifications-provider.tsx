"use client"

import { useEffect } from "react"
import { socket, playMessageSound } from "@openchat/lib"
import { useChatsStore } from "../stores/chat-store"

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (msg: {
      chatPublicId: string
      senderId: number
    }) => {
      const store = useChatsStore.getState()

      if (store.activeChatPublicId === msg.chatPublicId) return

      if (!store.chats.some(c => c.chatPublicId === msg.chatPublicId)) return

      store.incrementUnread(msg.chatPublicId)
      playMessageSound()
    }

    socket.on("chat-notification", handler)
    return () => {
      socket.off("chat-notification", handler)
    }
  }, [])

  return <>{children}</>
}
